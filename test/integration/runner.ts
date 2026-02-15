import { join } from 'node:path';
import { readFileSync } from 'fs';
import { inspect } from 'util';
import { sleep } from './utils';
import { TestContext } from './context';
import { downloadElectron } from './download';
import { installDepsAndBuild, prepareTestFiles } from './prepare';
import { createTestServer, TestServer } from './server';
import { createTestLogger, getCurrentElectronVersion } from './utils';
import { TestData } from './test-data';
import { afterEach, beforeEach, expect, onTestFailed, test } from 'vitest';

function getTestMeta(path: string) {
  const pkgJsonPath = join(path, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, { encoding: 'utf8' }).toString());
  return { name: pkgJson.name, description: pkgJson.description, hasBuildScript: !!pkgJson?.scripts?.build };
}

type ExpectedTestData = TestData | ((event: TestData) => void);

type Expected =
  | {
      testData: ExpectedTestData;
    };


type Version = { major: number; minor: number; patch: number; string: string };

interface ElectronTestContext {
  expect: (expect: Expected) => this;
  expectErrorOutputToContain: (error: string) => this;
  ignoreExpectationOrder: () => this;
  run: () => Promise<void>;
}

interface ElectronTestOptions {
  timeout?: number;
  runTwice?: boolean;
  skipEsmAutoTransform?: boolean;
  waitAfterExpectedEvents?: number;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  appExecutionPath?: string;
  skip?: (electronVersion: Version) => boolean;
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

  // Ideally we want to bail out before beforeEach
//   if (options.skip?.(electronVersion)) {
//     test(description, (ctx) => ctx.skip());
//     return;
//   }

  const testExecutionRoot = join(__dirname, 'dist', name);
  const convertToEsm = !options.skipEsmAutoTransform && electronVersion.major >= 28;

  let server: TestServer | undefined;
  let electronPath: string | undefined;
  let context: TestContext | undefined;

  let expectedErrorOutput: string | undefined;
  let ignoreOrder = false;

  let resolve: undefined | (() => void);
  let reject: undefined | ((reason: unknown) => void);

  const completePromise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const unorderedEvents: Array<TestData> = [];

  function onNewServerEventIgnoreOrder(event: TestData) {
    try {
      log('Received event', inspect(event, false, null, true));

      unorderedEvents.push(event);

      if (unorderedEvents.length === expectations.length) {
        const expectedEvents = expectations.map((e) => {
          if ('envelope' in e) {
            return e.envelope;
          }
          if ('minidump' in e) {
            return e.minidump;
          }

          return undefined;
        });

        expect(unorderedEvents).toEqual(expect.arrayContaining(expectedEvents));
      }
    } catch (e) {
      reject?.(e);
    }

    if (expectations.length === 0) {
      if (options.waitAfterExpectedEvents) {
        sleep(options.waitAfterExpectedEvents).then(() => {
          resolve?.();
        });
      } else {
        resolve?.();
      }
    }
  }

  function onNewServerEvent(event: TestData) {
    try {
      log('Received event', inspect(event, false, null, true));

      const expected = expectations.shift();
      if (!expected) {
        throw new Error('Server received an event but none were expected');
      }

	  expect(event).toEqual(expected);
    } catch (e) {
      reject?.(e);
    }

    if (expectations.length === 0) {
      if (options.waitAfterExpectedEvents) {
        sleep(options.waitAfterExpectedEvents).then(() => {
          resolve?.();
        });
      } else {
        resolve?.();
      }
    }
  }

  beforeEach(async () => {
    electronPath = await downloadElectron(electronVersion.string);
    server = createTestServer(logger, ignoreOrder ? onNewServerEventIgnoreOrder : onNewServerEvent);

    await prepareTestFiles(logger, testPath, testExecutionRoot, electronVersion.string, server.port, convertToEsm);
    await installDepsAndBuild(logger, options.packageManager || 'npm', testExecutionRoot, hasBuildScript);

    const executionPath = options.appExecutionPath
      ? join(testExecutionRoot, options.appExecutionPath)
      : testExecutionRoot;

    context = new TestContext(logger, electronPath, executionPath, name);
  }, 120_000);

  afterEach(async () => {
    await Promise.race([Promise.all([context?.stop(), server?.close()]), sleep(8_000)]);
  });
  process.on('exit', async () => {
    await context?.stop();
  });

  test(description, async () => {
    if (!electronPath) {
      throw new Error('Electron path is not set');
    }

    if (!process.env.DEBUG) {
      onTestFailed(() => {
        logger.outputTestLog();
      });
    }

    await callback({
      expect: function (expect) {
        expectations.push(expect);
        return this;
      },
      expectErrorOutputToContain: function (error) {
        expectedErrorOutput = error;
        return this;
      },
      ignoreExpectationOrder: function () {
        ignoreOrder = true;
        return this;
      },
      run: async () => {
        const expectationsLength = expectations.length;

        if (!context) {
          throw new Error('Context is not set');
        }

        await context.start();

        if (options.runTwice) {
          await context.waitForAppClose();
          log('First app instance has closed');
          await context.stop({ retainData: true });
          await context.start({ secondRun: true });
        }

        // If there are no expectations, we wait for 10 seconds to ensure to events are sent
        if (expectationsLength === 0 && expectedErrorOutput === undefined) {
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
  }, options.timeout || 15_000 );
}
