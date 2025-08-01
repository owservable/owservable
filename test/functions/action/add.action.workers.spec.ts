'use strict';

import addActionWorkers from '../../../src/functions/action/add.action.workers';

// Mock the external dependencies
jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../src/functions/execute/execute.worker', () => ({
	default: jest.fn()
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;
const mockExecuteWorker = require('../../../src/functions/execute/execute.worker').default;

describe('addActionWorkers tests', () => {
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
		expect(typeof addActionWorkers).toBe('function');
	});

	it('should handle actions with asWorker method', () => {
		const mockActionPath = '/path/to/worker.js';
		const mockAction = {
			asWorker: jest.fn(),
			asWorkerInit: jest.fn()
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'workers');
		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing worker action', mockActionPath);
		expect(MockActionClass).toHaveBeenCalled();
		expect(mockExecuteWorker).toHaveBeenCalledWith({
			init: mockAction.asWorkerInit,
			work: mockAction.asWorker
		});
	});

	it('should handle actions with asWorker method but no asWorkerInit', () => {
		const mockActionPath = '/path/to/worker2.js';
		const mockAction = {
			asWorker: jest.fn()
			// No asWorkerInit method
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).toHaveBeenCalledWith({
			work: mockAction.asWorker
		});
	});

	it('should skip actions without asWorker method', () => {
		const mockActionPath = '/path/to/invalid-worker.js';
		const mockAction = {
			// No asWorker method
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).not.toHaveBeenCalled();
	});

	it('should handle actions with asWorkerInit as non-function', () => {
		const mockActionPath = '/path/to/worker3.js';
		const mockAction = {
			asWorker: jest.fn(),
			asWorkerInit: 'not-a-function' // Non-function value
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).toHaveBeenCalledWith({
			init: 'not-a-function',
			work: mockAction.asWorker
		});
	});
});
