export interface CallbackInvokeRequest {
	method: string,
	args: unknown[],
}

export interface DispatchedCallback {
	dispatchedCallbackName: string
}

export function isCallbackInvokeRequest(msg: unknown): msg is CallbackInvokeRequest {
	const mayBeRequest = msg as CallbackInvokeRequest;

	return mayBeRequest !== null &&
		typeof mayBeRequest.method === 'string' &&
		Array.isArray(mayBeRequest.args);
}

export const BRIDGE_INVOKE_REQUEST_CHANNEL = 'api-provider:bridge-request';

export const CALLBACK_BRIDGE_NAME = '__ElectronWCAPBridge__';
