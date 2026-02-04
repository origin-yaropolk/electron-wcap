export interface CallackInvokeRequest {
	method: string,
	args: unknown[],
}

export interface DispachedCallback {
	dispatchedCallbackName: string
}

export function isCallackInvokeRequest(msg: unknown): msg is CallackInvokeRequest {
	const mayBeRequest = msg as CallackInvokeRequest;

	return mayBeRequest !== null &&
		typeof mayBeRequest.method === 'string' &&
		Array.isArray(mayBeRequest.args);
}

export const BRIDGE_INVOKE_REQUEST_CHANEL = 'api-provider:bridge-request';

export const CALLBACK_BRIDGE_NAME = '__ElectronWCAPBridge__';
