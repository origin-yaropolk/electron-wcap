import { contextBridge, ipcRenderer } from 'electron';

import { BRIDGE_INVOKE_REQUEST_CHANNEL, CallbackInvokeRequest, CALLBACK_BRIDGE_NAME } from '../common/protocol';

export function enableCallbacks(): void {
	contextBridge.exposeInMainWorld(CALLBACK_BRIDGE_NAME, {
		invoke(callbackName: string, args: unknown[]): unknown {
			const invokeRequest: CallbackInvokeRequest = {
				method: callbackName,
				args
			};

			return ipcRenderer.sendSync(BRIDGE_INVOKE_REQUEST_CHANNEL, invokeRequest);
		}
	});
}
