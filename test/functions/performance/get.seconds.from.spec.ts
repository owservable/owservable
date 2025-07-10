'use strict';

import getSecondsFrom, {NS_PER_SEC} from '../../../src/functions/performance/get.seconds.from';
import getHrtimeAsNumber from '../../../src/functions/performance/get.hrtime.as.number';

describe('get.seconds.from tests', () => {
	it('should be defined', () => {
		expect(getSecondsFrom).toBeDefined();
		expect(typeof getSecondsFrom).toBe('function');
	});

	it('should export NS_PER_SEC constant', () => {
		expect(NS_PER_SEC).toBeDefined();
		expect(NS_PER_SEC).toBe(1e9);
		expect(typeof NS_PER_SEC).toBe('number');
	});

	it('should return a number', () => {
		const start = getHrtimeAsNumber();
		const result = getSecondsFrom(start);
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThanOrEqual(0);
	});

	it('should return 0 or very small positive number for same timestamp', () => {
		const now = getHrtimeAsNumber();
		const result = getSecondsFrom(now);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThan(0.001); // Should be less than 1ms
	});

	it('should return increasing values for elapsed time', () => {
		const start = getHrtimeAsNumber();
		// Small delay to ensure time passes
		const after1 = getSecondsFrom(start);
		const after2 = getSecondsFrom(start);

		expect(after2).toBeGreaterThanOrEqual(after1);
	});

	it('should handle different start times correctly', () => {
		const start1 = getHrtimeAsNumber();
		// Small delay to ensure difference
		for (let i = 0; i < 1000; i++) {
			// Simple loop to create measurable time difference
		}
		const start2 = getHrtimeAsNumber();

		const elapsed1 = getSecondsFrom(start1);
		const elapsed2 = getSecondsFrom(start2);

		expect(elapsed1).toBeGreaterThan(elapsed2);
	});

	it('should return valid decimal seconds', () => {
		const start = getHrtimeAsNumber() - 1500000000; // 1.5 seconds ago in nanoseconds
		const result = getSecondsFrom(start);

		expect(result).toBeGreaterThan(0);
		expect(Number.isFinite(result)).toBe(true);
	});
});
