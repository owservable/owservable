'use strict';

import DataMiddlewareMap from '../../src/middleware/data.middleware.map';

describe('data.middleware.map.ts tests', () => {
	it('DataMiddlewareMap exists', () => {
		expect(DataMiddlewareMap).toBeDefined();
		expect(typeof DataMiddlewareMap).toBe('function');
	});
	it('DataMiddlewareMap functionality', () => {
		let keys = DataMiddlewareMap.keys();
		expect(keys).toHaveLength(0);
		expect(DataMiddlewareMap.hasMiddleware('users')).toBe(false);
		expect(DataMiddlewareMap.getMiddleware('users')).toBeUndefined();

		const processor = () => console.log('processor');

		DataMiddlewareMap.addMiddleware('users', processor);
		keys = DataMiddlewareMap.keys();
		expect(keys).toHaveLength(1);
		expect(DataMiddlewareMap.hasMiddleware('users')).toBe(true);
		expect(DataMiddlewareMap.getMiddleware('users')).toBeDefined();
		expect(DataMiddlewareMap.getMiddleware('users')).toBe(processor);
	});
});

