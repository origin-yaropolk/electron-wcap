import { contextBridge, ipcRenderer } from 'electron';

import { BRIDGE_INVOKE_REQUEST_CHANNEL, CallbackInvokeRequest, CALLBACK_BRIDGE_NAME, DispatchedCallback, BRIDGE_DELETE_REQUEST_CHANNEL, CallbackDeleteRequest } from '../common/protocol';

export function enableCallbacks(): void {
	contextBridge.exposeInMainWorld(CALLBACK_BRIDGE_NAME, {
		invoke(callbackName: string, args: unknown[]): unknown {
			const invokeRequest: CallbackInvokeRequest = {
				method: callbackName,
				args
			};

			return ipcRenderer.sendSync(BRIDGE_INVOKE_REQUEST_CHANNEL, invokeRequest);
		},

		deleteCb(callbackName: string): void {
			const deleteRequest: CallbackDeleteRequest = {
				method: callbackName
			};

			ipcRenderer.send(BRIDGE_DELETE_REQUEST_CHANNEL, deleteRequest);
		},

		register(cb: (args: unknown[]) => void, held: {name: string, weak: WeakRef<(_: unknown[]) => unknown>}): void {
			this.ensureFinalizator();
			this.finalizator.register(cb, held);
		},

		ensureFinalizator(): void {
			if (this.finalizator) {
				return;
			}

			this.finalizator = new FinalizationRegistry((held: {name: string, weak: WeakRef<(_: unknown[]) => unknown>}) => {
				if (held.weak.deref() === undefined) {
					return;
				}

				const deleteRequest: CallbackDeleteRequest = {
					method: held.name
				};

				ipcRenderer.send(BRIDGE_DELETE_REQUEST_CHANNEL, deleteRequest);
			});
		}
	});
}
