import { ipcMain, WebContents } from "electron";
import { BRIDGE_INVOKE_REQUEST_CHANEL, isCallackInvokeRequest } from "./protocol";

export class CallbackRegistry {
	private readonly callbacks = new Map<number, Map<string, (...args: unknown[]) => unknown>>();

	constructor() {
		ipcMain.on(BRIDGE_INVOKE_REQUEST_CHANEL, (event: Electron.IpcMainEvent, msg) => {
			if (isCallackInvokeRequest(msg)) {
				const callback = this.callbacks.get(event.sender.id)?.get(msg.method);

				if (!callback) {
					console.error(`CallbackRegistry: callback '${msg.method}' is not registered in host '${event.sender.id}'`);
					return;
				}

				event.returnValue = callback?.call(null, ...msg.args);
				return;
			}

			console.error('CallbackRegistry: got non callback invocation request');
		});
	}

	registerCallback(webContents: WebContents, callback: (...args: unknown[]) => unknown): string {
		if (!callback.name) {
			throw new Error('CallbackRegistry: callback must have a name. Use function decration syntax, if you didn\'t');
		}

		let callbacksByIdBucket = this.callbacks.get(webContents.id);
        if (!callbacksByIdBucket) {
			callbacksByIdBucket = new Map<string, (...args: unknown[]) => unknown>();
			this.callbacks.set(webContents.id, callbacksByIdBucket);
			this.watchForHost(webContents);
        }

		if (callbacksByIdBucket.has(callback.name)) {
			throw new Error(`CallbackRegistry: callback with name '${callback.name}', already registered in host with id '${webContents.id}'`);
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