import { readdirSync } from 'fs';
import { join } from 'path';
import * as semver from 'semver';
import { inspect } from 'util';

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export interface TestLogger {
	createLogger(name: string): (...args: unknown[]) => void;
	getLogOutput(): string[];
	outputTestLog(): void;
}

export function createTestLogger(): TestLogger {
	const TEST_LOG: unknown[][] = [];

	return {
		createLogger(name: string): (...args: unknown[]) => void {
			return (...args: unknown[]) => {
				TEST_LOG.push([`[${ name }]`, ...args]);

				if (process.env.DEBUG) {
					console.log(`[${ name }]`, ...args);
				}
			};
		},
		getLogOutput(): string[] {
			const output = [];

			for (const args of TEST_LOG) {
				output.push(args.map((a) => (typeof a === 'string' ? a : inspect(a, false, null, true))).join(' '));
			}

			return output;
		},
		outputTestLog(): void {
			for (const args of TEST_LOG) {
				console.log(...args);
			}
		},
	};
}

export function getCurrentElectronVersion(): {
		major: number;
		minor: number;
		patch: number;
		asString: string;
		} {
	if (!process.env.ELECTRON_VERSION) {
		throw new Error('ELECTRON_VERSION is not set');
	}
	const version = semver.parse(process.env.ELECTRON_VERSION);
	return {
		major: version?.major || 0,
		minor: version?.minor || 0,
		patch: version?.patch || 0,
		asString: process.env.ELECTRON_VERSION,
	};
}

export function* walkSync(dir: string): Generator<string> {
	const files = readdirSync(dir, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) {
			yield * walkSync(join(dir, file.name));
		}
		else {
			yield join(dir, file.name);
		}
	}
}

export function makeAwaiter<T = void>(): [(value: T | PromiseLike<T>) => void, Promise<T>, (reason?: unknown) => void] {
	let resolver: ((value: T | PromiseLike<T>) => void) | null = null;
	let rejecter: ((reason?: unknown) => void) | null = null;

	const awaiter = new Promise<T>((resolve, reject) => {
		resolver = resolve;
		rejecter = reject;
	});

	if (resolver && rejecter) {
		return [resolver, awaiter, rejecter];
	}

	throw Error('MakeAwaiter: should not be executed');
}
