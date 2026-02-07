export function apiKeyNotExists(apiKey: string, webContentsId: number): Error {
	return Error(`electron-wcap: api with key '${ apiKey }' does not exists in host with id '${ webContentsId }'`);
}

export function callbackNotRegistered(method: string, senderId: number): Error {
	return Error(`electron-wcap: callback '${ method }' is not registered in host '${ senderId }'`);
}

export function nonInvocationRequest(): Error {
	return Error('electron-wcap: got non callback invocation request')
}

export function callbackWithoutName(): Error {
	return Error('electron-wcap: callback must have a name - use function decration syntax');
}

export function callbackRegisteredAlready(callbackName: string, webContentsId: number): Error {
	return Error(`electron-wcap: callback with name '${ callbackName }' already registered in host with id '${ webContentsId }'`);
}

export function bridgeNotRegistered(): Error {
	return Error('electron-wcap: __ApiProviderBridge__ does not exists; make sure you have expose it via preload');
}

export function exportFromRoot(): Error {
	return Error(`electron-wcap uses different code for the main and preload processes:

		In the Electron main process you should import 'electron-wcap/main'
		In the Electron preload you should import 'electron-wcap/preload'

		`);
}
