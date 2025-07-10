'use strict';

import initiateWorkers from '../../src/functions/initiate.workers';
import executeWorker from '../../src/functions/execute/execute.worker';
import executeProcessesInFolder from '../../src/functions/execute/execute.processes.in.folder';

// Mock the dependencies
jest.mock('../../src/functions/execute/execute.worker');
jest.mock('../../src/functions/execute/execute.processes.in.folder');

const mockExecuteWorker = executeWorker as jest.MockedFunction<typeof executeWorker>;
const mockExecuteProcessesInFolder = executeProcessesInFolder as jest.MockedFunction<typeof executeProcessesInFolder>;

describe('initiate.workers tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(initiateWorkers).toBeDefined();
		expect(typeof initiateWorkers).toBe('function');
	});

	it('should call executeProcessesInFolder with default folder name', () => {
		const root = '/test/root';

		initiateWorkers(root);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, 'workers', mockExecuteWorker);
	});

	it('should call executeProcessesInFolder with custom folder name', () => {
		const root = '/test/root';
		const customFolder = 'custom-workers';

		initiateWorkers(root, customFolder);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, customFolder, mockExecuteWorker);
	});

	it('should handle different root paths', () => {
		const testRoots = ['/home/user/project', './src', '../parent/dir', 'C:\\Windows\\System32', '/var/www/html'];

		testRoots.forEach((root) => {
			initiateWorkers(root);
		});

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(testRoots.length);
		testRoots.forEach((root, index) => {
			expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(index + 1, root, 'workers', mockExecuteWorker);
		});
	});

	it('should handle empty string root', () => {
		const root = '';

		initiateWorkers(root);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('', 'workers', mockExecuteWorker);
	});

	it('should handle empty string folder', () => {
		const root = '/test/root';
		const folder = '';

		initiateWorkers(root, folder);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, '', mockExecuteWorker);
	});

	it('should pass executeWorker function correctly', () => {
		const root = '/test/root';

		initiateWorkers(root);

		const passedFunction = mockExecuteProcessesInFolder.mock.calls[0][2];
		expect(passedFunction).toBe(mockExecuteWorker);
	});

	it('should work multiple times with different parameters', () => {
		initiateWorkers('/root1', 'workers1');
		initiateWorkers('/root2', 'workers2');
		initiateWorkers('/root3');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(3);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(1, '/root1', 'workers1', mockExecuteWorker);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(2, '/root2', 'workers2', mockExecuteWorker);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(3, '/root3', 'workers', mockExecuteWorker);
	});
});
