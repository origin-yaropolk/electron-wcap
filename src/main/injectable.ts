import { bridgeNotRegistered } from '../common/errors';
import { DispatchedCallback } from '../common/protocol';

export function invoke(apiKey: string, method: string, args: unknown[]): unknown {
	function isDispachedCallback(o: unknown): o is DispatchedCallback {
		return typeof o === 'object' && typeof (o as DispatchedCallback).dispatchedCallbackName === 'string';
	}

	function checkBridgeExists(): void {
		if (window.__ElectronWCAPBridge__ === null || window.__ElectronWCAPBridge__ === undefined) {
			throw bridgeNotRegistered();
		}
	}

	function handleDispatchedCallback(arg: unknown, index: number): void {
		if (isDispachedCallback(arg)) {
			checkBridgeExists();

			const name = arg.dispatchedCallbackName;

			const cb = (...cbArgs: unknown[]) => {
				return window.__ElectronWCAPBridge__.invoke(name, cbArgs);
			};

			if (!window.finalizator) {
				window.finalizator = new FinalizationRegistry((name: string) => {
					window.__ElectronWCAPBridge__.deleteCb(name);
				});
			}

			window.finalizator.register(cb, name);

			args[index] = cb;
		}
	}

	args.map(handleDispatchedCallback);

	const api = window[apiKey] as { [key: string]: (...args: unknown[]) => unknown };
	return api[method](...args);
}

export function apiExists(apiKey: string): boolean {
	return window[apiKey] !== null && window[apiKey] !== undefined && typeof window[apiKey] === 'object';
}
