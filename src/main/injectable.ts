import { DispachedCallback } from "../common/protocol";

export function invoke(apiKey: string, method: string, args: unknown[]): unknown {
	function isDispachedCallback(o: unknown): o is DispachedCallback {
		return typeof o === 'object' && typeof (o as DispachedCallback).dispatchedCallbackName === 'string';
	}

	function checkBridgeExists(): void {
		if (window.ElectronWCAPBridge === null && window.ElectronWCAPBridge === undefined) {
			throw new Error('ApiProvider: ApiProviderBridge does not exists. Make sure you have expose it via preload');
		}
	}

	args.map((arg, index) => {
		if (isDispachedCallback(arg)) {
			checkBridgeExists();

			const name = arg.dispatchedCallbackName;
			args[index] = (...args: unknown[]) => {
				return window.ElectronWCAPBridge.invoke(name, args);
			}
		}
	})

	const api = window[apiKey];
	return api[method](...args);
}

export function apiExists(apiKey: string): boolean {
	return window[apiKey] !== null && window[apiKey] !== undefined && typeof window[apiKey] === 'object';
}
