
export interface CallbackBridge {
	invoke(callbackName: string, ...args: unknown[]): unknown;
	deleteCb(callbackName: string): void;
}
