import { contextBridge, ipcRenderer } from 'electron';

import { BRIDGE_INVOKE_REQUEST_CHANNEL, BRIDGE_REMOVE_REQUEST_CHANNEL, CALLBACK_BRIDGE_NAME, CallbackInvokeRequest, CallbackRemoveRequest } from '../common/protocol';

export function enableCallbacks(): void {
	contextBridge.exposeInMainWorld(CALLBACK_BRIDGE_NAME, {
		invoke(callbackName: string, args: unknown[]): unknown {
			const invokeRequest: CallbackInvokeRequest = {
				method: callbackName,
				args
			};

			return ipcRenderer.sendSync(BRIDGE_INVOKE_REQUEST_CHANNEL, invokeRequest);
		},
		remove(callbackName: string): unknown {
			const removeRequest: CallbackRemoveRequest = {
				method: callbackName,
			};

			return ipcRenderer.sendSync(BRIDGE_REMOVE_REQUEST_CHANNEL, removeRequest);
		}
	});
}
