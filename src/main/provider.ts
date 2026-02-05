import { WebContents } from 'electron';
import { Promisify } from 'promisify-ts';

import { DispatchedCallback } from '../common/protocol';
import { CallbackRegistry, globalCallbacksRegistry } from './callback-registry';
import { apiExists, invoke } from './injectable';
import { apiKeyNotExists } from '../common/errors';

export type WebContentsApiProvider<T> = Promisify<T> & { readonly webContents: WebContents };

class ApiProviderPropertiesHandler {
	constructor(readonly webContents: WebContents, readonly apiKey: string, private readonly callbackRegistry: CallbackRegistry) {}

	compile<P extends unknown[]>(fn: (...args: P) => unknown, ...args: P): string {
		return `(${ fn.toString() })(${ this.serializeArguments(...args) })`;
	};

	serializeArguments(...args: unknown[]): string {
		const serialized = args.map((arg: unknown): string => {
			if (Array.isArray(arg)) {
				arg.forEach((value: unknown[], index) => {
					if (typeof value === 'function') {
						const dispatched: DispatchedCallback = {
							dispatchedCallbackName: this.callbackRegistry.registerCallback(this.webContents, value)
						};

						arg[index] = dispatched;
					}
				});
			}

			return JSON.stringify(arg);
		});

		return serialized.join(',');
	}
}

class ApiProviderProxyHandler {
	private readonly properties: Record<string, unknown> = {};

	constructor(private readonly apiExistsAwaiter: Promise<boolean>) {}

	get(context: ApiProviderPropertiesHandler, propertyKey: keyof ApiProviderPropertiesHandler): unknown {
		if (Object.hasOwn(context, propertyKey) || typeof context[propertyKey] === 'function') {
			return context[propertyKey];
		}

		const propertyProxy = this.properties[propertyKey];

		if (propertyProxy) {
			return propertyProxy;
		}

		const apiExistsClosure = this.apiExistsAwaiter;

		// proxy context must be a function, to allow using handler 'apply'.
		const propProxy = new Proxy(() => {}, {
			async apply(_target: unknown, this_: ApiProviderPropertiesHandler, args: unknown[]): Promise<unknown> {
				if (!(await apiExistsClosure)) {
					throw apiKeyNotExists(this_.apiKey, this_.webContents.id);
				}

				const injectable = this_.compile(invoke, this_.apiKey, propertyKey, args);

				return this_.webContents.executeJavaScript(injectable);
			},
		});

		this.properties[propertyKey] = propProxy;

		return propProxy;
	}
}

export function createApiProvider<ApiInterface>(webContents: WebContents, apiKey: string): WebContentsApiProvider<ApiInterface> {
	const propertiesHandler = new ApiProviderPropertiesHandler(webContents, apiKey, globalCallbacksRegistry());

	const checkApiExistsInjectable = propertiesHandler.compile(apiExists, apiKey);
	const checkApiExistsPromise = webContents.executeJavaScript(checkApiExistsInjectable) as Promise<boolean>;

	const proxyHandler = new ApiProviderProxyHandler(checkApiExistsPromise);

	return new Proxy(propertiesHandler, proxyHandler) as WebContentsApiProvider<ApiInterface>;
}
