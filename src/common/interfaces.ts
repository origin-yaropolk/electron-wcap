export interface CallbackBridge {
	invoke(callbackName: string, ...args: unknown[]): unknown;
	remove(callbackName: string): unknown;
}
