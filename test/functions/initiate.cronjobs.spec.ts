'use strict';

import initiateCronjobs from '../../src/functions/initiate.cronjobs';
import executeCronjob from '../../src/functions/execute/execute.cronjob';
import executeProcessesInFolder from '../../src/functions/execute/execute.processes.in.folder';

// Mock the dependencies
jest.mock('../../src/functions/execute/execute.cronjob');
jest.mock('../../src/functions/execute/execute.processes.in.folder');

const mockExecuteCronjob = executeCronjob as jest.MockedFunction<typeof executeCronjob>;
const mockExecuteProcessesInFolder = executeProcessesInFolder as jest.MockedFunction<typeof executeProcessesInFolder>;

describe('initiate.cronjobs tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(initiateCronjobs).toBeDefined();
		expect(typeof initiateCronjobs).toBe('function');
	});

	it('should call executeProcessesInFolder with default folder name', () => {
		const root = '/test/root';

		initiateCronjobs(root);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, 'cronjobs', mockExecuteCronjob);
	});

	it('should call executeProcessesInFolder with custom folder name', () => {
		const root = '/test/root';
		const customFolder = 'custom-cronjobs';

		initiateCronjobs(root, customFolder);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, customFolder, mockExecuteCronjob);
	});

	it('should handle different root paths', () => {
		const testRoots = [
			'/home/user/project',
			'./src',
			'../parent/dir',
			'C:\\Windows\\System32',
			'/var/www/html'
		];

		testRoots.forEach(root => {
			initiateCronjobs(root);
		});

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(testRoots.length);
		testRoots.forEach((root, index) => {
			expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(index + 1, root, 'cronjobs', mockExecuteCronjob);
		});
	});

	it('should handle empty string root', () => {
		const root = '';

		initiateCronjobs(root);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('', 'cronjobs', mockExecuteCronjob);
	});

	it('should handle empty string folder', () => {
		const root = '/test/root';
		const folder = '';

		initiateCronjobs(root, folder);

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith(root, '', mockExecuteCronjob);
	});

	it('should pass executeCronjob function correctly', () => {
		const root = '/test/root';

		initiateCronjobs(root);

		const passedFunction = mockExecuteProcessesInFolder.mock.calls[0][2];
		expect(passedFunction).toBe(mockExecuteCronjob);
	});

	it('should work multiple times with different parameters', () => {
		initiateCronjobs('/root1', 'cronjobs1');
		initiateCronjobs('/root2', 'cronjobs2');
		initiateCronjobs('/root3');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(3);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(1, '/root1', 'cronjobs1', mockExecuteCronjob);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(2, '/root2', 'cronjobs2', mockExecuteCronjob);
		expect(mockExecuteProcessesInFolder).toHaveBeenNthCalledWith(3, '/root3', 'cronjobs', mockExecuteCronjob);
	});
});
