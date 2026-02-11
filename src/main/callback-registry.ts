import { ipcMain, WebContents } from 'electron';

import { BRIDGE_INVOKE_REQUEST_CHANNEL, BRIDGE_DELETE_REQUEST_CHANNEL, isCallbackInvokeRequest, isCallbackDeleteRequest } from '../common/protocol';
import { callbackNotRegistered, callbackRegisteredAlready, callbackWithoutName, nonDeletionRequest, nonInvocationRequest } from '../common/errors';

export class CallbackRegistry {
	private readonly callbacks = new Map<number, Map<string, (..._: unknown[]) => unknown>>();

	constructor() {
		ipcMain.on(BRIDGE_INVOKE_REQUEST_CHANNEL, (event: Electron.IpcMainEvent, msg: unknown) => {
			if (isCallbackInvokeRequest(msg)) {
				const callback = this.callbacks.get(event.sender.id)?.get(msg.method);

				if (!callback) {
					console.error(callbackNotRegistered(msg.method, event.sender.id));
					return;
				}

				event.returnValue = callback(...msg.args);
				return;
			}

			console.error(nonInvocationRequest());
		});

		ipcMain.on(BRIDGE_DELETE_REQUEST_CHANNEL, (event: Electron.IpcMainEvent, msg: unknown) => {
			if (isCallbackDeleteRequest(msg)) {
				this.unregisterCallback(event.sender.id, msg.method);
				return;
			}

			console.log(nonDeletionRequest());
		});
	}

	registerCallback(webContents: WebContents, callback: (..._: unknown[]) => unknown): string {
		if (!callback.name) {
			throw callbackWithoutName();
		}

		let callbacksByIdBucket = this.callbacks.get(webContents.id);
		if (!callbacksByIdBucket) {
			callbacksByIdBucket = new Map<string, (...args: unknown[]) => unknown>();
			this.callbacks.set(webContents.id, callbacksByIdBucket);
			this.watchForHost(webContents);
		}

		if (callbacksByIdBucket.has(callback.name)) {
			throw callbackRegisteredAlready(callback.name, webContents.id);
		}

		callbacksByIdBucket.set(callback.name, callback);
		return callback.name;
	}

	unregisterCallback(hostId: number, name: string): boolean {
		const callbacksByIdBucket = this.callbacks.get(hostId);

		if (!callbacksByIdBucket) {
			return false;
		}

		return callbacksByIdBucket.delete(name);
	}

	unregisterAll(hostId: number): boolean {
		return this.callbacks.delete(hostId);
	}

	private watchForHost(webContents: WebContents): void {
		webContents.once('destroyed', () => {
			this.callbacks.delete(webContents.id);
		});
	}
}

let registryInstance: CallbackRegistry | null = null;

export function globalCallbacksRegistry(): CallbackRegistry {
	if (!registryInstance) {
		registryInstance = new CallbackRegistry();
	}

	return registryInstance;
}
