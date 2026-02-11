export interface CallbackInvokeRequest {
	method: string,
	args: unknown[],
}

export interface CallbackDeleteRequest {
	method: string,
}

export interface DispatchedCallback {
	dispatchedCallbackName: string;
}

export function isCallbackInvokeRequest(msg: unknown): msg is CallbackInvokeRequest {
	return msg !== null &&
		typeof msg === 'object' &&
		'method' in msg &&
		typeof msg.method === 'string' &&
		'args' in msg &&
		Array.isArray(msg.args);
}

export function isCallbackDeleteRequest(msg: unknown): msg is CallbackDeleteRequest {
	return msg !== null &&
		typeof msg === 'object' &&
		'method' in msg &&
		typeof msg.method === 'string';
}

export const BRIDGE_INVOKE_REQUEST_CHANNEL = 'electron-wcap:bridge-invoke-request';
export const BRIDGE_DELETE_REQUEST_CHANNEL = 'electron-wcap:bridge-delete-request';

export const CALLBACK_BRIDGE_NAME = '__ElectronWCAPBridge__';
