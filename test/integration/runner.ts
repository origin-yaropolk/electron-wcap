import { readFileSync } from 'fs';
import { join } from 'node:path';
import { inspect } from 'util';
import { afterEach, beforeEach, expect, onTestFailed, test } from 'vitest';

import { TestContext } from './context';
import { downloadElectron } from './download';
import { installDepsAndBuild, prepareTestFiles } from './prepare';
import { createTestServer, TestServer } from './server';
import { TestData } from './test-data';
import { createTestLogger, getCurrentElectronVersion, makeAwaiter, sleep } from './utils';

function getTestMeta(path: string): { name: string, description: string, hasBuildScript: boolean } {
	const pkgJsonPath = join(path, 'package.json');
	const pkgJson = JSON.parse(readFileSync(pkgJsonPath, { encoding: 'utf8' }).toString()) as { name: string, description: string, scripts: { build: string }};
	return { name: pkgJson.name, description: pkgJson.description, hasBuildScript: !!pkgJson?.scripts?.build };
}

type ExpectedTestData = TestData | ((event: TestData) => void);

type Expected = ExpectedTestData;

interface ElectronTestContext {
	expect(expect: Expected): this;
	expectErrorOutputToContain(error: string): this;
	run(): Promise<void>;
}

interface ElectronTestOptions {
	timeout?: number;
	skipEsmAutoTransform?: boolean;
	waitAfterExpectedEvents?: number;
	packageManager?: 'npm' | 'yarn' | 'pnpm';
	appExecutionPath?: string;
}

type ElectronTestCallback = (ctx: ElectronTestContext) => Promise<void>;

export function electronTestRunner(testPath: string, callback: ElectronTestCallback): void;
export function electronTestRunner(
	testPath: string,
	options: ElectronTestOptions,
	callback: ElectronTestCallback,
): void;
export function electronTestRunner(
	testPath: string,
	optOrCallback: ElectronTestOptions | ElectronTestCallback,
	maybeCallback?: ElectronTestCallback,
): void {
	const callback = typeof optOrCallback === 'function' ? optOrCallback : (maybeCallback as ElectronTestCallback);
	const options = typeof optOrCallback === 'object' ? optOrCallback : {};

	const logger = createTestLogger();
	const log = logger.createLogger('Test Runner');

	const expectations: Expected[] = [];
	const { name, description, hasBuildScript } = getTestMeta(testPath);
	const electronVersion = getCurrentElectronVersion();

	const testExecutionRoot = join(__dirname, 'dist', name);
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const convertToEsm = !options.skipEsmAutoTransform && electronVersion.major >= 28;

	let server: TestServer | undefined;
	let electronPath: string | undefined;
	let context: TestContext | undefined;

	let expectedErrorOutput: string | undefined;

	const [resolve, completePromise, reject] = makeAwaiter();

	function onNewServerEvent(event: TestData): void {
		try {
			log('Received event', inspect(event, false, null, true));

			const expected = expectations.shift();
			if (!expected) {
				throw new Error('Server received an event but none were expected');
			}

			expect(event).toEqual(expected);
		}
		catch (e) {
			reject?.(e);
		}

		if (expectations.length === 0) {
			if (options.waitAfterExpectedEvents) {
				sleep(options.waitAfterExpectedEvents).then(() => {
					resolve?.();
				});
			}
			else {
				resolve?.();
			}
		}
	}

	beforeEach(async() => {
		electronPath = await downloadElectron(electronVersion.asString);
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		server = createTestServer(8081, logger, onNewServerEvent);

		await prepareTestFiles(logger, testPath, testExecutionRoot, electronVersion.asString, convertToEsm);
		await installDepsAndBuild(logger, options.packageManager || 'npm', testExecutionRoot, hasBuildScript);

		const executionPath = options.appExecutionPath
			? join(testExecutionRoot, options.appExecutionPath)
			: testExecutionRoot;

		context = new TestContext(logger, electronPath, executionPath, name);
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	}, 120_000);

	afterEach(async() => {
		await Promise.race([
			Promise.all([
				new Promise<void>((resolveStop) => { context?.stop(); resolveStop(); }),
				server?.close()]),
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			sleep(8_000)
		]);
	});
	process.on('exit', () => {
		context?.stop();
	});

	test(description, async() => {
		if (!electronPath) {
			throw new Error('Electron path is not set');
		}

		if (!process.env.DEBUG) {
			onTestFailed(() => {
				logger.outputTestLog();
			});
		}

		await callback({
			expect: function(expectation) {
				expectations.push(expectation);
				return this;
			},
			expectErrorOutputToContain: function(error) {
				expectedErrorOutput = error;
				return this;
			},
			run: async() => {
				const expectationsLength = expectations.length;

				if (!context) {
					throw new Error('Context is not set');
				}

				await context.start();

				// If there are no expectations, we wait for 10 seconds to ensure to events are sent
				if (expectationsLength === 0 && expectedErrorOutput === undefined) {
					// eslint-disable-next-line @typescript-eslint/no-magic-numbers
					sleep(10_000).then(() => {
						resolve?.();
					});
				}

				if (expectedErrorOutput) {
					log('Waiting for app to close so we can check the error output');
					await context.waitForAppClose();

					const output = logger.getLogOutput().join(' ');
					expect(output).toContain(expectedErrorOutput);

					if (expectationsLength === 0) {
						resolve?.();
					}
				}

				await completePromise;
			},
		});
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	}, options.timeout || 15_000);
}
