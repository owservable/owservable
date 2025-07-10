'use strict';

import getHrtimeAsNumber from '../../../src/functions/performance/get.hrtime.as.number';

describe('get.hrtime.as.number tests', () => {
	it('should be defined', () => {
		expect(getHrtimeAsNumber).toBeDefined();
		expect(typeof getHrtimeAsNumber).toBe('function');
	});

	it('should return a number', () => {
		const result = getHrtimeAsNumber();
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThan(0);
	});

	it('should return increasing values when called multiple times', () => {
		const first = getHrtimeAsNumber();
		const second = getHrtimeAsNumber();
		const third = getHrtimeAsNumber();

		expect(second).toBeGreaterThanOrEqual(first);
		expect(third).toBeGreaterThanOrEqual(second);
	});

	it('should return values that can be used for time calculations', () => {
		const start = getHrtimeAsNumber();
		// Small delay to ensure time passes
		const end = getHrtimeAsNumber();
		const elapsed = end - start;

		expect(elapsed).toBeGreaterThanOrEqual(0);
		expect(typeof elapsed).toBe('number');
	});

	it('should return consistent format numbers', () => {
		const result = getHrtimeAsNumber();
		expect(Number.isInteger(result)).toBe(true);
		expect(Number.isFinite(result)).toBe(true);
	});
});
