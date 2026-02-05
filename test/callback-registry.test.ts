import { CallbackRegistry } from '../src/main/callback-registry';

const ipcHandlers: { handler?: (event: Electron.IpcMainEvent, msg: unknown) => void } = {};

jest.mock('electron', () => ({
	ipcMain: {
		on: jest.fn((_channel: string, handler: (event: Electron.IpcMainEvent, msg: unknown) => void) => {
			ipcHandlers.handler = handler;
		})
	}
}));

function createMockWebContents(id: number = 1): Electron.WebContents {
	return {
		id,
		once(_event: 'destroyed', _listener: (event: unknown) => void): void { return; }
	} as unknown as Electron.WebContents;
}

function createMockEvent(senderId: number): Electron.IpcMainEvent {
	return {
		sender: { id: senderId } as Electron.WebContents,
		returnValue: undefined
	} as unknown as Electron.IpcMainEvent;
}

function simulateIpcMessage(event: Electron.IpcMainEvent, msg: unknown): void {
	ipcHandlers.handler?.(event, msg);
}

describe('CallbackRegistry', () => {
	let registry: CallbackRegistry;

	beforeEach(() => {
		registry = new CallbackRegistry();
		jest.clearAllMocks();
	});

	describe('registerCallback', () => {
		it('registers a named callback and returns its name', () => {
			function myCallback() { return 42; }
			const webContents = createMockWebContents();

			const name = registry.registerCallback(webContents, myCallback);

			expect(name).toBe('myCallback');
		});

		it('throws when callback has no name', () => {
			const webContents = createMockWebContents();

			expect(() => registry.registerCallback(webContents, () => {}))
				.toThrow('CallbackRegistry: callback must have a name');
		});

		it('throws when same callback name is registered twice for same host', () => {
			function myCallback() {}
			const webContents = createMockWebContents();

			registry.registerCallback(webContents, myCallback);

			expect(() => registry.registerCallback(webContents, myCallback))
				.toThrow("CallbackRegistry: callback with name 'myCallback', already registered");
		});

		it('allows same callback name for different hosts', () => {
			function myCallback() {}
			const wc1 = createMockWebContents(1);
			const wc2 = createMockWebContents(2);

			registry.registerCallback(wc1, myCallback);
			const name2 = registry.registerCallback(wc2, myCallback);

			expect(name2).toBe('myCallback');
		});
	});

	describe('unregisterCallback', () => {
		it('returns true when callback exists and removes it', () => {
			function myCallback() {}
			const webContents = createMockWebContents(1);
			registry.registerCallback(webContents, myCallback);

			const result = registry.unregisterCallback(1, 'myCallback');

			expect(result).toBe(true);
		});

		it('returns false when host has no callbacks', () => {
			const result = registry.unregisterCallback(999, 'nonexistent');

			expect(result).toBe(false);
		});

		it('returns false when callback name does not exist', () => {
			function myCallback() {}
			const webContents = createMockWebContents();
			registry.registerCallback(webContents, myCallback);

			const result = registry.unregisterCallback(1, 'otherCallback');

			expect(result).toBe(false);
		});
	});

	describe('ipc handler', () => {
		it('invokes registered callback when receiving valid request', () => {
			function myCb(a: number, b: number) { return a + b; }
			const webContents = createMockWebContents();
			registry.registerCallback(webContents, myCb);

			const event = createMockEvent(1);
			simulateIpcMessage(event, { method: 'myCb', args: [1, 2] });

			expect(event.returnValue).toBe(3);
		});

		it('does not invoke when callback is not registered for host', () => {
			const event = createMockEvent(999);
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			simulateIpcMessage(event, { method: 'nonexistent', args: [] });

			expect(consoleSpy).toHaveBeenCalledWith(
				"CallbackRegistry: callback 'nonexistent' is not registered in host '999'"
			);
			consoleSpy.mockRestore();
		});
	});
});
