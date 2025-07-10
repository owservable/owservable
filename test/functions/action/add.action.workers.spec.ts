'use strict';

import addActionWorkers from '../../../src/functions/action/add.action.workers';

// Mock the external dependencies
jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn().mockResolvedValue([])
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;

describe('addActionWorkers tests', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it('should call listSubfoldersFilesByFolderName with correct parameters', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionWorkers('/test/root', 'workers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'workers');
	});

	it('should handle empty folder results', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionWorkers('/test/root', 'workers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'workers');
		// Should not log any initialization messages when no files are found
		expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[@owservable] -> Initializing worker action'));
	});

	it('should handle different folder names', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionWorkers('/different/root', 'custom-workers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/different/root', 'custom-workers');
	});

	it('should be a function', () => {
		expect(typeof addActionWorkers).toBe('function');
	});
});
