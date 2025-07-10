'use strict';

import initiateWatchers from '../../src/functions/initiate.watchers';
import executeWatcher from '../../src/functions/execute/execute.watcher';
import executeProcessesInFolder from '../../src/functions/execute/execute.processes.in.folder';

// Mock the dependencies
jest.mock('../../src/functions/execute/execute.watcher');
jest.mock('../../src/functions/execute/execute.processes.in.folder');

const mockExecuteWatcher = executeWatcher as jest.MockedFunction<typeof executeWatcher>;
const mockExecuteProcessesInFolder = executeProcessesInFolder as jest.MockedFunction<typeof executeProcessesInFolder>;

describe('initiate.watchers tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(initiateWatchers).toBeDefined();
		expect(typeof initiateWatchers).toBe('function');
	});

	it('should call executeProcessesInFolder with default folder name', () => {
		const root = '/test/root';

		initiateWatchers(root);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, 'watchers', mockExecuteWatcher);
	});

	it('should call executeProcessesInFolder with custom folder name', () => {
		const root = '/test/root';
		const customFolder = 'custom-watchers';

		initiateWatchers(root, customFolder);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, customFolder, mockExecuteWatcher);
	});

	it('should handle different root paths', () => {
		const testRoots = ['/home/user/project', './src', '../parent/dir', 'C:\\Windows\\System32', '/var/www/html'];

		testRoots.forEach((root) => {
			initiateWatchers(root);
		});

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(testRoots.length);
		testRoots.forEach((root, index) => {
			expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(index + 1, root, 'watchers', mockExecuteWatcher);
		});
	});

	it('should handle empty string root', () => {
		const root = '';

		initiateWatchers(root);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('', 'watchers', mockExecuteWatcher);
	});

	it('should handle empty string folder', () => {
		const root = '/test/root';
		const folder = '';

		initiateWatchers(root, folder);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, '', mockExecuteWatcher);
	});

	it('should pass executeWatcher function correctly', () => {
		const root = '/test/root';

		initiateWatchers(root);

		const passedFunction = mockExecuteProcessesInFolder.mock.calls[0][2];
		expect(passedFunction).toBe(mockExecuteWatcher);
	});

	it('should work multiple times with different parameters', () => {
		initiateWatchers('/root1', 'watchers1');
		initiateWatchers('/root2', 'watchers2');
		initiateWatchers('/root3');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(3);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(1, '/root1', 'watchers1', mockExecuteWatcher);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(2, '/root2', 'watchers2', mockExecuteWatcher);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(3, '/root3', 'watchers', mockExecuteWatcher);
	});
});
