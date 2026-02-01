import { CallbackBridge } from "./interfaces";

declare global {
	interface Window {
		[key: string]: any;
		ElectronWCAPBridge: CallbackBridge;
	}
}
