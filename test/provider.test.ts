import { createApiProvider } from '../src/main/provider';

jest.mock('electron', () => ({
	ipcMain: { on: jest.fn() }
}));

const mockExecuteJavaScript = jest.fn();

function createMockWebContents(id: number): Electron.WebContents {
	return {
		id,
		executeJavaScript: mockExecuteJavaScript
	} as unknown as Electron.WebContents;
}

describe('createApiProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns provider with webContents property', () => {
		const webContents = createMockWebContents(1);
		mockExecuteJavaScript.mockResolvedValue(true);

		const provider = createApiProvider(webContents, 'myApi');

		expect(provider.webContents).toBe(webContents);
	});

	it('calls executeJavaScript for apiExists check on creation', async () => {
		const webContents = createMockWebContents(1);
		mockExecuteJavaScript.mockResolvedValue(true);

		createApiProvider(webContents, 'myApi');

		expect(mockExecuteJavaScript).toHaveBeenCalled();
		expect(mockExecuteJavaScript.mock.calls[0][0]).toContain('apiExists');
		expect(mockExecuteJavaScript.mock.calls[0][0]).toContain('myApi');
	});

	it('invokes method and returns result from executeJavaScript', async () => {
		const webContents = createMockWebContents(1);
		mockExecuteJavaScript
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce('method-result');

		interface TestApi { getValue(): Promise<string> }
		const provider = createApiProvider<TestApi>(webContents, 'myApi');
		const result = await provider.getValue();

		expect(result).toBe('method-result');
		expect(mockExecuteJavaScript).toHaveBeenCalledTimes(2);
		expect(mockExecuteJavaScript.mock.calls[1][0]).toContain('invoke');
		expect(mockExecuteJavaScript.mock.calls[1][0]).toContain('getValue');
	});

	it('throws when api does not exist in renderer', async () => {
		const webContents = createMockWebContents(1);
		mockExecuteJavaScript.mockResolvedValue(false);

		interface TestApi { getValue(): Promise<string> }
		const provider = createApiProvider<TestApi>(webContents, 'missingApi');

		await expect(provider.getValue()).rejects.toThrow(
			"ApiProvider: Api with key 'missingApi' does not exists in host with id '1'"
		);
	});

	it('serializes plain arguments as JSON', async () => {
		const webContents = createMockWebContents(1);
		mockExecuteJavaScript
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(undefined);

		interface TestApi { doSomething(a: number, b: string): Promise<void> }
		const provider = createApiProvider<TestApi>(webContents, 'myApi');
		await provider.doSomething(42, 'hello');

		const injectable = mockExecuteJavaScript.mock.calls[1][0] as string;
		expect(injectable).toContain('42');
		expect(injectable).toContain('hello');
	});

	it('replaces functions in arrays with DispatchedCallback', async () => {
		const webContents = createMockWebContents(1);
		mockExecuteJavaScript
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(undefined);

		function namedCallback() {}
		interface TestApi { withCallbacks(callbacks: Array<() => void>): Promise<void> }
		const provider = createApiProvider<TestApi>(webContents, 'myApi');
		await provider.withCallbacks([namedCallback]);

		expect(mockExecuteJavaScript).toHaveBeenCalledTimes(2);
		const injectable = mockExecuteJavaScript.mock.calls[1][0] as string;
		expect(injectable).toContain('withCallbacks');
		// Full callback serialization verification is in integration test and callback-registry unit test
	});
});
