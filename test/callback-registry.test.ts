import { callbackNotRegistered, callbackRegisteredAlready, callbackWithoutName, nonInvocationRequest } from '../src/common/errors';
import { CallbackRegistry } from '../src/main/callback-registry';

const ipcHandlers: { handler?(event: Electron.IpcMainEvent, msg: unknown): void } = {};
const destroyHandlers = new Map<number, (event: unknown) => void>();

jest.mock('electron', () => ({
	ipcMain: {
		on: jest.fn((_channel: string, handler: (event: Electron.IpcMainEvent, msg: unknown) => void) => {
			ipcHandlers.handler = handler;
		})
	}
}));

export function createMockWebContents(id: number = 1): Electron.WebContents {
	return {
		id,
		once(_event: 'destroyed', listener: (event: unknown) => void): void { destroyHandlers.set(id, listener); },
		close(): void { destroyHandlers.get(id)?.(id); }
	} as unknown as Electron.WebContents;
}

export function createMockEvent(senderId: number): Electron.IpcMainEvent {
	return {
		sender: { id: senderId } as Electron.WebContents,
		returnValue: undefined
	} as unknown as Electron.IpcMainEvent;
}

export function simulateIpcMessage(event: Electron.IpcMainEvent, msg: unknown): void {
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
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			function myCallback(): number { return 42; }
			const webContents = createMockWebContents();

			const name = registry.registerCallback(webContents, myCallback);

			expect(name).toBe('myCallback');
		});

		it('throws when callback has no name', () => {
			const webContents = createMockWebContents();

			expect(() => registry.registerCallback(webContents, () => {}))
				.toThrow(callbackWithoutName().message);
		});

		it('throws when not invocation request recevied', () => {
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			const event = createMockEvent(999);
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			simulateIpcMessage(event, 'non invocation request');

			expect(consoleSpy).toHaveBeenCalledWith(nonInvocationRequest());
			consoleSpy.mockRestore();
		});

		it('throws when same callback name is registered twice for same host', () => {
			function myCallback(): void {}
			const webContents = createMockWebContents();

			registry.registerCallback(webContents, myCallback);

			expect(() => registry.registerCallback(webContents, myCallback))
				.toThrow(callbackRegisteredAlready(myCallback.name, webContents.id));
		});

		it('allows same callback name for different hosts', () => {
			function myCallback(): void {}
			const wc1 = createMockWebContents(1);
			const wc2 = createMockWebContents(2);

			registry.registerCallback(wc1, myCallback);
			const name2 = registry.registerCallback(wc2, myCallback);

			expect(name2).toBe('myCallback');
		});
	});

	describe('unregisterCallback', () => {
		it('returns true when callback exists and removes it', () => {
			function myCallback(): void {}
			const webContents = createMockWebContents(1);
			registry.registerCallback(webContents, myCallback);

			const result = registry.unregisterCallback(1, 'myCallback');

			expect(result).toBe(true);
		});

		it('returns false when host has no callbacks', () => {
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			const result = registry.unregisterCallback(999, 'nonexistent');

			expect(result).toBe(false);
		});

		it('returns false when callback name does not exist', () => {
			function myCallback(): void {}
			const webContents = createMockWebContents();
			registry.registerCallback(webContents, myCallback);

			const result = registry.unregisterCallback(1, 'otherCallback');

			expect(result).toBe(false);
		});
	});

	describe('ipc handler', () => {
		it('invokes registered callback when receiving valid request', () => {
			function myCb(a: number, b: number): number { return a + b; }
			const webContents = createMockWebContents();
			registry.registerCallback(webContents, myCb as (..._: unknown[]) => unknown);

			const event = createMockEvent(1);
			simulateIpcMessage(event, { method: 'myCb', args: [1, 2] });

			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			expect(event.returnValue).toBe(3);
		});

		it('does not invoke when callback is not registered for host', () => {
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			const event = createMockEvent(999);
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			simulateIpcMessage(event, { method: 'nonexistent', args: [] });

			expect(consoleSpy).toHaveBeenCalledWith(callbackNotRegistered('nonexistent', event.sender.id));
			consoleSpy.mockRestore();
		});
	});

	describe('destroy handler', () => {
		it('clears host bucket when it\'s destroyed', () => {
			function myCb(a: number, b: number): number { return a + b; }
			const webContents = createMockWebContents();
			registry.registerCallback(webContents, myCb as (..._: unknown[]) => unknown);

			const event = createMockEvent(1);
			simulateIpcMessage(event, { method: 'myCb', args: [1, 2] });

			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			expect(event.returnValue).toBe(3);

			webContents.close();

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			simulateIpcMessage(event, { method: 'myCb', args: [2, 3] });

			expect(consoleSpy).toHaveBeenCalledWith(callbackNotRegistered('myCb', event.sender.id));
			consoleSpy.mockRestore();
		});
	});
});
