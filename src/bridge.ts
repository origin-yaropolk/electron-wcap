import { contextBridge, ipcRenderer } from "electron";
import { BRIDGE_INVOKE_REQUEST_CHANEL, CallackInvokeRequest } from "./protocol";

export const CALLBACK_BRIDGE_NAME = 'ElectronWCAPBridge';

export interface CallbackBridge {
	invoke(callbackName: string, ...args: unknown[]): unknown;
}

export function enableCallbacks(): void {
	contextBridge.exposeInMainWorld(CALLBACK_BRIDGE_NAME, {
		invoke(callbackName: string, args: unknown[]): unknown {
			const invokeRequest: CallackInvokeRequest = {
				method: callbackName,
				args: args
			}

			return ipcRenderer.sendSync(BRIDGE_INVOKE_REQUEST_CHANEL, invokeRequest);
		}
	});
}
