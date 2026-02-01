import { WebContents } from "electron";

import { CallbackRegistry, globalCallbacksRegistry } from "./callback-registry";
import { DispachedCallback } from "../common/protocol";
import { apiExists, invoke } from "./injectable";
import { Promisify } from "promisify-ts"

export type WebContentsApiProvider<T> = Promisify<T> & { readonly webContents: WebContents };

class ApiProviderPropertiesHandler {
	constructor(readonly webContents: WebContents, readonly apiKey: string, private readonly callbackRegistry: CallbackRegistry){}

	compile<P extends unknown[], R extends unknown>(fn: (...args: P) => R, ...args: P): string {
		return `(${fn.toString()})(${this.serializeArguments(...args)})`;
	};

	serializeArguments(...args: unknown[]): string[] {
		const serialized = args.map((arg: unknown): string => {
			if (Array.isArray(arg)) {
				arg.forEach((value, index) => {
					if (typeof value === 'function') {
						const dispatched: DispachedCallback = {
							dispatchedCallbackName: this.callbackRegistry.registerCallback(this.webContents, value)
						}

						arg[index] = dispatched;
					}
				});
			}

			return JSON.stringify(arg)
		});

		return serialized;
	}
}

class ApiProviderProxyHandler {
	private readonly properties: Record<string, unknown> = {};

	constructor(private readonly apiExists: Promise<boolean>) {}

	get(context: ApiProviderPropertiesHandler, propertyKey: keyof ApiProviderPropertiesHandler): unknown {
		if (Object.hasOwn(context, propertyKey) || typeof context[propertyKey] === 'function') {
			return context[propertyKey];
		}

		const propertyProxy = this.properties[propertyKey];

		if (propertyProxy) {
			return propertyProxy;
		}

		const apiExistsClosure = this.apiExists;

		// proxy context must be a function, to allow using handler 'apply'.
		const propProxy = new Proxy(() => {}, {
			async apply(_target: unknown, this_: ApiProviderPropertiesHandler, args: unknown[]): Promise<unknown> {
				if (!(await apiExistsClosure)) {
					throw new Error(`ApiProvider: Api with key '${this_.apiKey}' does not exists in host with id '${this_.webContents.id}'`);
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
	const checkApiExistsPromise = webContents.executeJavaScript(checkApiExistsInjectable);

	const proxyHandler = new ApiProviderProxyHandler(checkApiExistsPromise);

	return new Proxy(propertiesHandler, proxyHandler) as WebContentsApiProvider<ApiInterface>;
}
