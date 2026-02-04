import { contextBridge, ipcRenderer } from 'electron';

import { BRIDGE_INVOKE_REQUEST_CHANEL, CallackInvokeRequest, CALLBACK_BRIDGE_NAME } from '../common/protocol';

export function enableCallbacks(): void {
	contextBridge.exposeInMainWorld(CALLBACK_BRIDGE_NAME, {
		invoke(callbackName: string, args: unknown[]): unknown {
			const invokeRequest: CallackInvokeRequest = {
				method: callbackName,
				args
			};

			return ipcRenderer.sendSync(BRIDGE_INVOKE_REQUEST_CHANEL, invokeRequest);
		}
	});
}
