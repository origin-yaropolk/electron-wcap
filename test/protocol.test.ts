import { isCallbackInvokeRequest } from '../src/common/protocol';

describe('isCallbackInvokeRequest', () => {
	it('returns true for valid CallbackInvokeRequest', () => {
		expect(isCallbackInvokeRequest({ method: 'myCallback', args: [] })).toBe(true);
		expect(isCallbackInvokeRequest({ method: 'cb', args: [1, 'a', true] })).toBe(true);
	});

	it('returns false for null', () => {
		expect(isCallbackInvokeRequest(null)).toBe(false);
	});

	it('returns false when method is not a string', () => {
		expect(isCallbackInvokeRequest({ method: 123, args: [] })).toBe(false);
		expect(isCallbackInvokeRequest({ method: undefined, args: [] })).toBe(false);
		expect(isCallbackInvokeRequest({ args: [] })).toBe(false);
	});

	it('returns false when args is not an array', () => {
		expect(isCallbackInvokeRequest({ method: 'cb', args: {} })).toBe(false);
		expect(isCallbackInvokeRequest({ method: 'cb', args: 'not-array' })).toBe(false);
		expect(isCallbackInvokeRequest({ method: 'cb' })).toBe(false);
	});

	it('returns false for non-object types', () => {
		expect(isCallbackInvokeRequest(undefined)).toBe(false);
		expect(isCallbackInvokeRequest('string')).toBe(false);
		expect(isCallbackInvokeRequest(42)).toBe(false);
	});
});
