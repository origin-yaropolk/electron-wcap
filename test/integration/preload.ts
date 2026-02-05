import { contextBridge } from 'electron';

import { enableCallbacks } from '../../src/preload/bridge';

enableCallbacks();

contextBridge.exposeInMainWorld('myApi', {
	getValue() {
		return 'method-result';
	},

	doSomething(_a: number, _b: string) {
		// no-op
	},

	withCallbacks(callbacks: Array<() => unknown>) {
		return callbacks[0]?.();
	}
});
