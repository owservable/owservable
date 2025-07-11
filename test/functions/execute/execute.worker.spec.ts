'use strict';

import executeWorker from '../../../src/functions/execute/execute.worker';
import WorkerType from '../../../src/types/worker.type';

describe('execute.worker tests', () => {
	it('should be defined', () => {
		expect(executeWorker).toBeDefined();
		expect(typeof executeWorker).toBe('function');
	});

	it('should execute work immediately when init is not a function', async () => {
		const mockWork = jest.fn();
		const worker: WorkerType = {
			init: 'not a function' as any,
			work: mockWork
		};

		executeWorker(worker);

		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should execute work immediately when init is undefined', async () => {
		const mockWork = jest.fn();
		const worker: WorkerType = {
			work: mockWork
		};

		executeWorker(worker);

		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should execute work after init resolves when init is a function', async () => {
		const mockWork = jest.fn();
		const mockInit = jest.fn().mockResolvedValue(undefined);
		const worker: WorkerType = {
			init: mockInit,
			work: mockWork
		};

		executeWorker(worker);

		// Wait for the promise to resolve
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockInit).toHaveBeenCalledTimes(1);
		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should handle missing work function', async () => {
		const mockInit = jest.fn().mockResolvedValue(undefined);
		const worker: WorkerType = {
			init: mockInit,
			work: undefined as any
		};

		executeWorker(worker);

		// Wait for the promise to resolve
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockInit).toHaveBeenCalledTimes(1);
		// Should not throw even if work is undefined
	});

	it('should handle worker with only work function', () => {
		const mockWork = jest.fn();
		const worker: WorkerType = {
			work: mockWork
		};

		executeWorker(worker);

		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should handle async work function', async () => {
		const mockWork = jest.fn().mockResolvedValue(undefined);
		const worker: WorkerType = {
			work: mockWork
		};

		executeWorker(worker);

		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should handle complex execution flow', async () => {
		const executionOrder: string[] = [];
		const mockInit = jest.fn().mockImplementation(() => {
			executionOrder.push('init');
			return Promise.resolve();
		});
		const mockWork = jest.fn().mockImplementation(() => {
			executionOrder.push('work');
		});
		const worker: WorkerType = {
			init: mockInit,
			work: mockWork
		};

		executeWorker(worker);

		// Wait for the promise to resolve
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(executionOrder).toEqual(['init', 'work']);
	});

	it('should handle undefined work with non-function init', () => {
		// This tests the missing branch: else work?.();
		const worker: WorkerType = {
			init: 'not a function' as any, // Forces else branch
			work: undefined as any         // Tests ?.() optional chaining
		};

		// Should not throw even with undefined work in else branch
		expect(() => executeWorker(worker)).not.toThrow();
	});
});
