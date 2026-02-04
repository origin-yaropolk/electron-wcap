# electron-wcap

Electron **W**eb**C**ontent **A**PI **P**rovider — call renderer APIs from the main process with support for passing callbacks.

## Overview

electron-wcap lets the main process use an API object that lives in a renderer (a `WebContents`). You get a typed proxy in the main process; calling a method runs the corresponding function in the renderer via injected script. Functions you pass as arguments are registered and bridged so the renderer can invoke them back into the main process.

- **Main process**: create a provider for a given `WebContents` and API key; use it like a normal async API.
- **Preload**: expose the callback bridge so renderer code can invoke those callbacks.
- **Renderer**: assign your API object to `window[apiKey]` and use it as usual.

## Install

```bash
npm add electron-wcap
```

Requires **Electron** (peer dependency). Node 22+ and pnpm are recommended (see `volta` in `package.json`).

## Usage

### 1. Main process

Import from `electron-wcap/main` and create a provider for a `WebContents` and a string `apiKey` that the renderer will use for the same API:

```ts
import { createApiProvider } from 'electron-wcap/main';

// e.g. after creating a BrowserWindow
const provider = createApiProvider<MyApi>(win.webContents, 'myApi');

function onData(data: unknown): void {
	// This callback runs in the main process when the renderer calls it
	console.log('Renderer sent:', data);
}

// Call renderer methods (return value is a Promise)
const result = await provider.someMethod('arg', onData);
```

- The generic `MyApi` is for typing only; the real implementation lives in the renderer.
- Callbacks must be **named functions** (used as registry keys).

### 2. Preload

Import from `electron-wcap/preload` and enable the callback bridge so the renderer can invoke callbacks passed from main:

```ts
import { enableCallbacks } from 'electron-wcap/preload';

enableCallbacks();
```

Load this script as the preload for any window whose renderer API you use with `createApiProvider`.

### 3. Renderer - optional

Expose your API on `window` under the same `apiKey` you used in `createApiProvider`:

```ts
const apiKey = 'myApi';

window[apiKey] = {
	someMethod(arg: string, callback: (data: unknown) => void) {
		// callback is a function that runs in the main process
		callback({ received: arg });
		return 'done';
	},
};
```

The renderer can call the callback (possibly asynchronously); the call is sent to the main process via IPC and the registered function runs there.

## API

### Main (`electron-wcap/main`)

- **`createApiProvider<ApiInterface>(webContents, apiKey)`**  
	Returns a proxy that implements `ApiInterface` (and `Promisify<ApiInterface>` so methods are async). Each property access returns an async function that runs the corresponding method in the renderer via `webContents.executeJavaScript`.  
	The proxy also has a readonly **`webContents`** property (the `WebContents` you passed in).

### Preload (`electron-wcap/preload`)

- **`enableCallbacks()`**  
	Exposes `__ElectronWCAPBridge__` on the renderer’s `window` via `contextBridge`, so renderer code can invoke callbacks that were passed from the main process.

### Important

- **Entry points**: Use `electron-wcap/main` in the main process and `electron-wcap/preload` in the preload script. Importing from `electron-wcap` alone throws an error that explains this.
- **Callback names**: Callbacks you pass from main must be named (e.g. `function onData(x) { ... }`), not anonymous, so they can be registered and invoked by name.
- **sandbox**: as Electron now deafult sandbox to `true`, you should disable sandoxing to use callbacks.

## Build

From the repo:

```bash
pnpm i
pnpm build
```

Output: `dist/` (CommonJS) and `dist/esm/` (ESM).

## Scripts

- `pnpm build` — Rollup build (CJS + ESM)
- `pnpm lint` — Lint (editorconfig + ESLint)

## License

See [LICENSE](LICENSE).
