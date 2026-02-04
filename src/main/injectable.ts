import { DispachedCallback } from '../common/protocol';

export function invoke(apiKey: string, method: string, args: unknown[]): unknown {
	function isDispachedCallback(o: unknown): o is DispachedCallback {
		return typeof o === 'object' && typeof (o as DispachedCallback).dispatchedCallbackName === 'string';
	}

	function checkBridgeExists(): void {
		if (window.__ElectronWCAPBridge__ === null && window.__ElectronWCAPBridge__ === undefined) {
			throw new Error('ApiProvider: ApiProviderBridge does not exists. Make sure you have expose it via preload');
		}
	}

	function handleDispatchedCallback(arg: unknown, index: number): void {
		if (isDispachedCallback(arg)) {
			checkBridgeExists();

			const name = arg.dispatchedCallbackName;
			args[index] = (...cbArgs: unknown[]) => {
				return window.__ElectronWCAPBridge__.invoke(name, cbArgs);
			};
		}
	}

	args.map(handleDispatchedCallback);

	const api = window[apiKey] as { [key: string]: (...args: unknown[]) => unknown };
	return api[method](...args);
}

export function apiExists(apiKey: string): boolean {
	return window[apiKey] !== null && window[apiKey] !== undefined && typeof window[apiKey] === 'object';
}
