'use strict';

import addActionWatchers from '../../../src/functions/action/add.action.watchers';

// Mock the external dependencies
jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn().mockResolvedValue([])
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;

describe('addActionWatchers tests', () => {
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

		await addActionWatchers('/test/root', 'watchers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'watchers');
	});

	it('should handle empty folder results', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionWatchers('/test/root', 'watchers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'watchers');
		// Should not log any initialization messages when no files are found
		expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[@owservable] -> Initializing watcher action'));
	});

	it('should handle different folder names', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionWatchers('/different/root', 'custom-watchers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/different/root', 'custom-watchers');
	});

	it('should be a function', () => {
		expect(typeof addActionWatchers).toBe('function');
	});
});
