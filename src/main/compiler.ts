import { DispatchedCallback } from '../common/protocol';
import { CallbackRegistry } from './callback-registry';
import { invoke } from './injectable';

export function compileInvoke<P extends unknown[]>(
	registry: CallbackRegistry,
	webContents: Electron.WebContents,
	apiKey: string,
	method: string,
	args: P): string {
	return `(${ invoke.toString() })("${ apiKey }","${ method }",[${ serializeArguments(registry, webContents, args) }])`;
};

export function compile<P extends unknown[]>(fn: (..._: P) => unknown, ...args: P): string {
	return `(${ fn.toString() })(${ serializeArgumentsRaw(args) })`;
}

function serializeArguments(registry: CallbackRegistry, webContents: Electron.WebContents, args: unknown[]): string {
	const serialized = args.map((arg: unknown, index: number) => {
		if (typeof arg === 'function') {
			const dispatched: DispatchedCallback = {
				dispatchedCallbackName: registry.registerCallback(webContents, arg as (..._: unknown[]) => unknown)
			};

			args[index] = dispatched;
		}

		return JSON.stringify(args[index]);
	});

	return serialized.join(',');
}

function serializeArgumentsRaw(...args: unknown[]): string {
	const serialized = args.map((arg: unknown) => {
		return JSON.stringify(arg);
	});

	return serialized.join(',');
}
