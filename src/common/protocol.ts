export interface CallbackInvokeRequest {
	method: string,
	args: unknown[],
}

export interface DispatchedCallback {
	dispatchedCallbackName: string
}

export function isCallbackInvokeRequest(msg: unknown): msg is CallbackInvokeRequest {
	return msg !== null &&
		typeof msg === 'object' &&
		'method' in msg &&
		typeof msg.method === 'string' &&
		'args' in msg &&
		Array.isArray(msg.args);
}

export const BRIDGE_INVOKE_REQUEST_CHANNEL = 'api-provider:bridge-request';

export const CALLBACK_BRIDGE_NAME = '__ElectronWCAPBridge__';
