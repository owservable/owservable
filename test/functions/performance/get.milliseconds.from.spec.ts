'use strict';

import getMillisecondsFrom from '../../../src/functions/performance/get.milliseconds.from';
import getHrtimeAsNumber from '../../../src/functions/performance/get.hrtime.as.number';

describe('get.milliseconds.from tests', () => {
	it('should be defined', () => {
		expect(getMillisecondsFrom).toBeDefined();
		expect(typeof getMillisecondsFrom).toBe('function');
	});

	it('should return a number', () => {
		const start = getHrtimeAsNumber();
		const result = getMillisecondsFrom(start);
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThanOrEqual(0);
	});

	it('should return 0 or very small positive number for same timestamp', () => {
		const now = getHrtimeAsNumber();
		const result = getMillisecondsFrom(now);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThan(1); // Should be less than 1ms
	});

	it('should return increasing values for elapsed time', () => {
		const start = getHrtimeAsNumber();
		const after1 = getMillisecondsFrom(start);
		const after2 = getMillisecondsFrom(start);

		expect(after2).toBeGreaterThanOrEqual(after1);
	});

	it('should return milliseconds (1000x seconds)', () => {
		const start = getHrtimeAsNumber() - 1000000000; // 1 second ago in nanoseconds
		const result = getMillisecondsFrom(start);

		// Should be approximately 1000ms (1 second)
		expect(result).toBeGreaterThan(999);
		expect(result).toBeLessThan(1001);
	});

	it('should handle different start times correctly', () => {
		const start1 = getHrtimeAsNumber();
		const start2 = getHrtimeAsNumber();

		const elapsed1 = getMillisecondsFrom(start1);
		const elapsed2 = getMillisecondsFrom(start2);

		expect(elapsed1).toBeGreaterThanOrEqual(elapsed2);
	});

	it('should return valid decimal milliseconds', () => {
		const start = getHrtimeAsNumber() - 1500000000; // 1.5 seconds ago in nanoseconds
		const result = getMillisecondsFrom(start);

		expect(result).toBeGreaterThan(0);
		expect(Number.isFinite(result)).toBe(true);
		// Should be approximately 1500ms (1.5 seconds)
		expect(result).toBeGreaterThan(1499);
		expect(result).toBeLessThan(1501);
	});

	it('should maintain precision for small time differences', () => {
		const start = getHrtimeAsNumber() - 500000; // 0.5ms ago in nanoseconds
		const result = getMillisecondsFrom(start);

		expect(result).toBeGreaterThan(0);
		expect(result).toBeLessThan(1);
	});
});
