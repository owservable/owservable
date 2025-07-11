'use strict';

import addActionCronjobs from '../../../src/functions/action/add.action.cronjobs';

// Mock the external dependencies
jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../src/functions/execute/execute.cronjob', () => ({
	default: jest.fn()
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;
const mockExecuteCronJob = require('../../../src/functions/execute/execute.cronjob').default;

describe('addActionCronjobs tests', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		jest.resetModules();
	});

	it('should call listSubfoldersFilesByFolderName with correct parameters', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionCronjobs('/test/root', 'cronjobs');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'cronjobs');
	});

	it('should handle empty folder results', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionCronjobs('/test/root', 'cronjobs');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'cronjobs');
		// Should not log any initialization messages when no files are found
		expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[@owservable] -> Initializing cronjob action'));
	});

	it('should handle different folder names', async () => {
		mockListSubfoldersFilesByFolderName.mockResolvedValue([]);

		await addActionCronjobs('/different/root', 'custom-cronjobs');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/different/root', 'custom-cronjobs');
	});

	it('should be a function', () => {
		expect(typeof addActionCronjobs).toBe('function');
	});

	it('should process action with asCronjob function and init function', async () => {
		const mockActionPath = '/test/path/action1.js';
		const mockAction = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: jest.fn().mockReturnValue({ some: 'init' })
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionCronjobs('/test/root', 'cronjobs');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing cronjob action', mockActionPath);
		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			init: { some: 'init' },
			job: mockAction.asCronjob
		});
	});

	it('should process action with asCronjob function but no init function', async () => {
		const mockActionPath = '/test/path/action2.js';
		const mockAction = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: 'not-a-function'
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionCronjobs('/test/root', 'cronjobs');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing cronjob action', mockActionPath);
		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			init: 'not-a-function',
			job: mockAction.asCronjob
		});
	});

	it('should skip action without asCronjob function', async () => {
		const mockActionPath = '/test/path/action3.js';
		const mockAction = {
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: jest.fn()
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionCronjobs('/test/root', 'cronjobs');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing cronjob action', mockActionPath);
		expect(mockExecuteCronJob).not.toHaveBeenCalled();
	});

	it('should process action with asCronjob function and no asCronjobInit property', async () => {
		const mockActionPath = '/test/path/action4.js';
		const mockAction = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *')
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionCronjobs('/test/root', 'cronjobs');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing cronjob action', mockActionPath);
		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			job: mockAction.asCronjob
		});
	});
});
