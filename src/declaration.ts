import { CallbackBridge } from "./bridge";

declare global {
	interface Window {
		[key: string]: any;
		ElectronWCAPBridge: CallbackBridge;
	}
}
