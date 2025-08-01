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

	it('should be a function', () => {
		expect(typeof addActionCronjobs).toBe('function');
	});

	it('should handle actions with asCronjob method', () => {
		const mockActionPath = '/path/to/action.js';
		const mockAction = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: jest.fn()
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		// Mock require to return our mock action class
		const originalRequire = require;
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'actions');
		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing cronjob action', mockActionPath);
		expect(MockActionClass).toHaveBeenCalled();
		expect(mockAction.schedule).toHaveBeenCalled();
		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			init: mockAction.asCronjobInit,
			job: mockAction.asCronjob
		});
	});

	it('should handle actions with asCronjob method but no asCronjobInit', () => {
		const mockActionPath = '/path/to/action2.js';
		const mockAction = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *')
			// No asCronjobInit method
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			job: mockAction.asCronjob
		});
	});

	it('should skip actions without asCronjob method', () => {
		const mockActionPath = '/path/to/invalid-action.js';
		const mockAction = {
			schedule: jest.fn().mockReturnValue('0 0 * * *')
			// No asCronjob method
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).not.toHaveBeenCalled();
	});

	it('should handle actions with asCronjobInit as non-function', () => {
		const mockActionPath = '/path/to/action3.js';
		const mockAction = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: 'not-a-function' // Non-function value
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			init: 'not-a-function',
			job: mockAction.asCronjob
		});
	});
});
