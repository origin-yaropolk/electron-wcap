import { inspect } from 'util';
import * as semver from 'semver';
import { readdirSync } from 'fs';
import { join } from 'path';

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
    string: string;
} {
  if (!process.env.ELECTRON_VERSION) {
    throw new Error('ELECTRON_VERSION is not set');
  }
  const version = semver.parse(process.env.ELECTRON_VERSION);
  return {
    major: version?.major || 0,
    minor: version?.minor || 0,
    patch: version?.patch || 0,
    string: process.env.ELECTRON_VERSION,
  };
}

export function* walkSync(dir: string): Generator<string> {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(join(dir, file.name));
    } else {
      yield join(dir, file.name);
    }
  }
}
