'use strict';

import Owservable from '../src/owservable';

describe('owservable.ts tests', () => {
	it('Owservable exists', () => {
		expect(Owservable).toBeDefined();
		expect(typeof Owservable).toBe('object');
	});

	it('should have the correct structure', () => {
		expect(Owservable).toEqual({});
		expect(Object.keys(Owservable)).toHaveLength(0);
	});

	it('should be an object', () => {
		expect(typeof Owservable).toBe('object');
		expect(Owservable).not.toBeNull();
		expect(Owservable).not.toBeUndefined();
	});
});
