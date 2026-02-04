import { CallbackBridge } from './interfaces';

declare global {
	interface Window {
		[key: string]: any;
		// eslint-disable-next-line @typescript-eslint/naming-convention
		__ElectronWCAPBridge__: CallbackBridge;
	}
}
