'use strict';

import addActionCronjobs from '../../../src/functions/action/add.action.cronjobs';

// Mock dependencies
jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn(),
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;

describe('addActionCronjobs tests', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it('should call listSubfoldersFilesByFolderName with correct parameters', () => {
		mockListSubfoldersFilesByFolderName.mockReturnValue([]);

		addActionCronjobs('/test/root', 'cronjobs');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'cronjobs');
	});

	it('should handle empty folder results', () => {
		mockListSubfoldersFilesByFolderName.mockReturnValue([]);

		addActionCronjobs('/test/root', 'cronjobs');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'cronjobs');
		// Should not log any initialization messages when no files are found
		expect(consoleLogSpy).not.toHaveBeenCalledWith(
			expect.stringContaining('[@owservable] -> Initializing cronjob action')
		);
	});

	it('should handle different folder names', () => {
		mockListSubfoldersFilesByFolderName.mockReturnValue([]);

		addActionCronjobs('/different/root', 'custom-cronjobs');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/different/root', 'custom-cronjobs');
	});

	it('should be a function', () => {
		expect(typeof addActionCronjobs).toBe('function');
	});
}); 