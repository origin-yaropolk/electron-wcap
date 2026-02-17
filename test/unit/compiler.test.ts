import { globalCallbacksRegistry } from '../../src/main/callback-registry';
import { compile, compileInvoke } from '../../src/main/compiler';
import { invoke } from '../../src/main/injectable';

const ipcHandlers: { handler?(event: Electron.IpcMainEvent, msg: unknown): void } = {};

jest.mock('electron', () => ({
	ipcMain: {
		on: jest.fn((_channel: string, handler: (event: Electron.IpcMainEvent, msg: unknown) => void) => {
			ipcHandlers.handler = handler;
		})
	}
}));

interface TestObject {
	id: number,
	payload: {
		data: string,
		size: number,
	}
}

function TestCompilableFunction(someName: string, arr: TestObject[], cb: (arg: string, b: number) => string): string {
	function checkNameNotEmpty(v: string): boolean {
		return v.length !== 0;
	}

	arr.forEach(v => console.log(v));

	if (checkNameNotEmpty(someName)) {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		return someName + ' ' + cb('qwe', 3);
	}

	return someName + ' ' + someName;
}

function createMockWebContents(id: number = 1): Electron.WebContents {
	return {
		id,
		once(_event: 'destroyed', _listener: (event: unknown) => void): void { return; }
	} as unknown as Electron.WebContents;
}

describe('compile', () => {
	it('result matches the reference', () => {
		const arg1 = 'SOME_VALUE';
		const arg2: TestObject[] = [
			{
				id: 1,
				payload: {
					data: '111',
					size: 3,
				}
			},
			{
				id: 2,
				payload: {
					data: '2222',
					size: 4,
				}
			}];
		const arg3 = (arg: string, n: number): string => {
			return arg.repeat(n);
		};

		const precompiledReference = TestCompilableFunction.toString();
		const reference = `(${ precompiledReference })(["SOME_VALUE",[{"id":1,"payload":{"data":"111","size":3}},{"id":2,"payload":{"data":"2222","size":4}}],null])`;

		const got = compile(TestCompilableFunction, arg1, arg2, arg3);

		expect(got).toEqual(reference);
	});
});

describe('compile invocation', () => {
	it('result matches the reference', () => {
		const registry = globalCallbacksRegistry();
		const webContents = createMockWebContents();
		const apiKey = 'SOME_API_KEY';
		const method = 'some_method';
		const arg1 = 'SOME_VALUE';
		const arg2: TestObject[] = [
			{
				id: 1,
				payload: {
					data: '111',
					size: 3,
				}
			},
			{
				id: 2,
				payload: {
					data: '2222',
					size: 4,
				}
			}];
		const arg3 = (arg: string, n: number): string => {
			return arg.repeat(n);
		};

		const precompiledReference = invoke.toString();
		// eslint-disable-next-line max-len
		const reference = `(${ precompiledReference })("SOME_API_KEY","some_method",["SOME_VALUE",[{"id":1,"payload":{"data":"111","size":3}},{"id":2,"payload":{"data":"2222","size":4}}],{"dispatchedCallbackName":"arg3"}])`;

		const got = compileInvoke(registry, webContents, apiKey, method, [arg1, arg2, arg3]);

		expect(got).toEqual(reference);
		expect(registry.unregisterCallback(webContents.id, arg3.name)).toBeTruthy();
	});
});
