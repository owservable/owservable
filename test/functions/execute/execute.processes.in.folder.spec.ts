'use strict';

import executeProcessesInFolder from '../../../src/functions/execute/execute.processes.in.folder';
import executeOnFilesRecursively from '../../../src/functions/execute/execute.on.files.recursively';
import {listSubfoldersByName} from '@owservable/folders';

// Mock external dependencies
jest.mock('@owservable/folders');
jest.mock('../../../src/functions/execute/execute.on.files.recursively');
jest.mock('lodash', () => ({
	each: jest.fn((collection, callback) => {
		if (Array.isArray(collection)) {
			collection.forEach(callback);
		}
		return collection;
	})
}));

// Import after mocking
import {each} from 'lodash';

describe('execute.processes.in.folder tests', () => {
	let mockListSubfoldersByName: jest.MockedFunction<(...args: any[]) => any>;
	let mockExecuteOnFilesRecursively: jest.MockedFunction<typeof executeOnFilesRecursively>;
	let mockEach: jest.MockedFunction<typeof each>;
	let mockExecute: jest.MockedFunction<any>;

	beforeEach(() => {
		// Get mocked functions
		mockListSubfoldersByName = listSubfoldersByName as jest.MockedFunction<(...args: any[]) => any>;
		mockExecuteOnFilesRecursively = executeOnFilesRecursively as jest.MockedFunction<typeof executeOnFilesRecursively>;
		mockEach = each as jest.MockedFunction<typeof each>;
		mockExecute = jest.fn();

		// Reset all mocks
		jest.clearAllMocks();

		// Setup default each behavior to actually call the callback
		mockEach.mockImplementation((collection: any, callback: any) => {
			if (Array.isArray(collection)) {
				collection.forEach(callback);
			}
			return collection;
		});
	});

	describe('executeProcessesInFolder function', () => {
		it('should execute processes in single folder', () => {
			const root = '/test/root';
			const folderName = 'workers';
			const mockFolders = ['/test/root/app1/workers'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockEach).toHaveBeenCalledWith(mockFolders, expect.any(Function));
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(1);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/test/root/app1/workers', mockExecute);
		});

		it('should execute processes in multiple folders', () => {
			const root = '/test/root';
			const folderName = 'workers';
			const mockFolders = ['/test/root/app1/workers', '/test/root/app2/workers', '/test/root/app3/workers'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockEach).toHaveBeenCalledWith(mockFolders, expect.any(Function));
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(3);
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(1, '/test/root/app1/workers', mockExecute);
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(2, '/test/root/app2/workers', mockExecute);
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(3, '/test/root/app3/workers', mockExecute);
		});

		it('should handle empty folders array', () => {
			const root = '/test/root';
			const folderName = 'nonexistent';
			const mockFolders: string[] = [];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockEach).toHaveBeenCalledWith(mockFolders, expect.any(Function));
			expect(mockExecuteOnFilesRecursively).not.toHaveBeenCalled();
		});

		it('should handle different folder names', () => {
			const root = '/project/root';
			const folderName = 'cronjobs';
			const mockFolders = ['/project/root/module1/cronjobs'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/project/root/module1/cronjobs', mockExecute);
		});

		it('should handle deeply nested folder paths', () => {
			const root = '/very/deep/project/root';
			const folderName = 'watchers';
			const mockFolders = ['/very/deep/project/root/module1/submodule/watchers', '/very/deep/project/root/module2/nested/deep/watchers'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(2);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/very/deep/project/root/module1/submodule/watchers', mockExecute);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/very/deep/project/root/module2/nested/deep/watchers', mockExecute);
		});

		it('should pass the correct execute function to each recursive call', () => {
			const root = '/test/root';
			const folderName = 'workers';
			const mockFolders = ['/test/root/app1/workers', '/test/root/app2/workers'];
			const customExecute = jest.fn();

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, customExecute);

			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(2);
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(1, '/test/root/app1/workers', customExecute);
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(2, '/test/root/app2/workers', customExecute);
		});

		it('should handle special characters in folder paths', () => {
			const root = '/test/root with spaces';
			const folderName = 'workers-with-dashes';
			const mockFolders = ['/test/root with spaces/app_1/workers-with-dashes'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/test/root with spaces/app_1/workers-with-dashes', mockExecute);
		});

		it('should work with different root paths', () => {
			const testCases = [
				{root: '/home/user/project', folderName: 'workers'},
				{root: 'C:\\Windows\\Project', folderName: 'cronjobs'},
				{root: './relative/path', folderName: 'watchers'},
				{root: '../parent/path', folderName: 'processes'}
			];

			testCases.forEach(({root, folderName}) => {
				const mockFolders = [`${root}/app/${folderName}`];
				mockListSubfoldersByName.mockReturnValue(mockFolders);

				executeProcessesInFolder(root, folderName, mockExecute);

				expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
				expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith(`${root}/app/${folderName}`, mockExecute);
			});
		});

		it('should handle single-element folder arrays', () => {
			const root = '/single/root';
			const folderName = 'workers';
			const mockFolders = ['/single/root/only-app/workers'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockEach).toHaveBeenCalledWith(mockFolders, expect.any(Function));
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(1);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/single/root/only-app/workers', mockExecute);
		});

		it('should handle many folders efficiently', () => {
			const root = '/large/project';
			const folderName = 'workers';
			const mockFolders = Array.from({length: 100}, (_, i) => `/large/project/app${i}/workers`);

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockEach).toHaveBeenCalledWith(mockFolders, expect.any(Function));
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(100);

			// Verify first and last calls as spot checks
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(1, '/large/project/app0/workers', mockExecute);
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(100, '/large/project/app99/workers', mockExecute);
		});
	});

	describe('integration behavior', () => {
		it('should properly delegate to dependencies', () => {
			const root = '/integration/test';
			const folderName = 'workers';
			const mockFolders = ['/integration/test/module/workers'];

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, mockExecute);

			// Verify correct dependency calls
			expect(mockListSubfoldersByName).toHaveBeenCalledTimes(1);
			expect(mockEach).toHaveBeenCalledTimes(1);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(1);

			// Verify correct parameters passed through
			expect(mockListSubfoldersByName).toHaveBeenCalledWith(root, folderName);
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith(mockFolders[0], mockExecute);
		});

		it('should maintain function reference consistency', () => {
			const root = '/test/root';
			const folderName = 'workers';
			const mockFolders = ['/test/root/app/workers'];
			const executeFn = jest.fn();

			mockListSubfoldersByName.mockReturnValue(mockFolders);

			executeProcessesInFolder(root, folderName, executeFn);

			// Verify the same function reference is passed through
			expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/test/root/app/workers', executeFn);
		});
	});
});
