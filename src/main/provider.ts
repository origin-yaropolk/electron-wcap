import { WebContents } from 'electron';
import { Promisify } from 'promisify-ts';

import { apiKeyNotExists } from '../common/errors';
import { CallbackRegistry, globalCallbacksRegistry } from './callback-registry';
import { compile, compileInvoke } from './compiler';
import { apiExists } from './injectable';

export type WebContentsApiProvider<T> = Promisify<T> & { readonly webContents: WebContents };

class ApiProviderPropertiesHandler {
	constructor(
		readonly webContents: WebContents,
		readonly apiKey: string,
		readonly callbackRegistry: CallbackRegistry
	) {}
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

		const apiExistsAwaiterClosure = this.apiExistsAwaiter;

		// proxy context must be a function, to allow using handler 'apply'.
		const propProxy = new Proxy(() => {}, {
			async apply(_target: unknown, this_: ApiProviderPropertiesHandler, args: unknown[]): Promise<unknown> {
				if (!(await apiExistsAwaiterClosure)) {
					throw apiKeyNotExists(this_.apiKey, this_.webContents.id);
				}

				const injectable = compileInvoke(globalCallbacksRegistry(), this_.webContents, this_.apiKey, propertyKey, args);

				return this_.webContents.executeJavaScript(injectable);
			},
		});

		this.properties[propertyKey] = propProxy;

		return propProxy;
	}
}

export function createApiProvider<ApiInterface>(webContents: WebContents, apiKey: string): WebContentsApiProvider<ApiInterface> {
	const propertiesHandler = new ApiProviderPropertiesHandler(webContents, apiKey, globalCallbacksRegistry());

	const checkApiExistsInjectable = compile(apiExists, apiKey);
	const checkApiExistsPromise = webContents.executeJavaScript(checkApiExistsInjectable) as Promise<boolean>;

	const proxyHandler = new ApiProviderProxyHandler(checkApiExistsPromise);

	return new Proxy(propertiesHandler, proxyHandler) as WebContentsApiProvider<ApiInterface>;
}

export function dropCallbacks<T>(apiProvider: WebContentsApiProvider<T>): boolean {
	return globalCallbacksRegistry().unregisterAll(apiProvider.webContents.id);
}
