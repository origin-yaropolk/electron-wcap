/**
 * Integration test: provider with real Electron API and real BrowserWindow.
 * Run with: pnpm test:integration
 *
 * Note: On Windows, a known Electron bug (see github.com/electron/electron/issues/49034)
 * may cause require('electron') to return the binary path instead of the API. The test
 * will work on macOS and Linux.
 */
import { join } from 'node:path';

import { app, BrowserWindow } from 'electron';

import { createApiProvider } from '../../src/main/provider';

const API_KEY = 'myApi';

interface TestApi {
	getValue(): Promise<string>;
	doSomething(a: number, b: string): Promise<void>;
	withCallbacks(callbacks: Array<() => unknown>): Promise<unknown>;
}

const results: { name: string; ok: boolean; error?: string }[] = [];

function ok(name: string): void {
	results.push({ name, ok: true });
}

function fail(name: string, error: unknown): void {
	results.push({ name, ok: false, error: String(error) });
}

async function run(): Promise<void> {
	if (!app || !BrowserWindow) {
		throw new Error(
			'Electron API not available (require("electron") returned wrong value). ' +
			'On Windows, see: https://github.com/electron/electron/issues/49034. ' +
			'Try running on macOS/Linux.'
		);
	}
	await app.whenReady();

	const preloadPath = join(__dirname, 'preload.js');
	const win = new BrowserWindow({
		show: false,
		webPreferences: {
			preload: preloadPath,
			contextIsolation: true,
			sandbox: false
		}
	});

	await win.loadURL('about:blank');

	const webContents = win.webContents;
	const provider = createApiProvider<TestApi>(webContents, API_KEY);

	// Same tests as provider.test.ts, but against real Electron

	try {
		if (provider.webContents === webContents) {
			ok('returns provider with webContents property');
		} else {
			fail('returns provider with webContents property', 'webContents mismatch');
		}
	} catch (e) {
		fail('returns provider with webContents property', e);
	}

	try {
		const result = await provider.getValue();
		if (result === 'method-result') {
			ok('invokes method and returns result from executeJavaScript');
		} else {
			fail('invokes method and returns result from executeJavaScript', `expected 'method-result', got ${result}`);
		}
	} catch (e) {
		fail('invokes method and returns result from executeJavaScript', e);
	}

	try {
		await provider.doSomething(42, 'hello');
		ok('serializes plain arguments as JSON');
	} catch (e) {
		fail('serializes plain arguments as JSON', e);
	}

	try {
		let callbackResult: unknown;
		function namedCallback() {
			return 'callback-called';
		}
		const result = await provider.withCallbacks([namedCallback]);
		callbackResult = result;
		if (callbackResult === 'callback-called') {
			ok('replaces functions in arrays with DispatchedCallback');
		} else {
			fail('replaces functions in arrays with DispatchedCallback', `expected 'callback-called', got ${callbackResult}`);
		}
	} catch (e) {
		fail('replaces functions in arrays with DispatchedCallback', e);
	}

	try {
		const missingProvider = createApiProvider<TestApi>(webContents, 'missingApi');
		await missingProvider.getValue();
		fail('throws when api does not exist in renderer', 'expected throw');
	} catch (e) {
		if (String(e).includes("Api with key 'missingApi' does not exists")) {
			ok('throws when api does not exist in renderer');
		} else {
			fail('throws when api does not exist in renderer', e);
		}
	}

	win.close();
	app.quit();

	const failed = results.filter(r => !r.ok);
	if (failed.length > 0) {
		console.error('\nIntegration test failures:');
		failed.forEach(r => console.error(`  - ${r.name}: ${r.error}`));
		process.exit(1);
	}

	console.log(`\nAll ${results.length} integration tests passed.`);
	process.exit(0);
}

run().catch((e) => {
	console.error('Integration test runner failed:', e);
	process.exit(1);
});
