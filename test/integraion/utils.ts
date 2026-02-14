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
