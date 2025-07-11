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

	it('should process action with asWorker function and init function', async () => {
		const mockActionPath = '/test/path/worker1.js';
		const mockAction = {
			asWorker: jest.fn(),
			asWorkerInit: jest.fn().mockReturnValue({ some: 'init' })
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWorkers('/test/root', 'workers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing worker action', mockActionPath);
		expect(mockExecuteWorker).toHaveBeenCalledWith({
			init: { some: 'init' },
			work: mockAction.asWorker
		});
	});

	it('should process action with asWorker function but no init function', async () => {
		const mockActionPath = '/test/path/worker2.js';
		const mockAction = {
			asWorker: jest.fn(),
			asWorkerInit: 'not-a-function'
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWorkers('/test/root', 'workers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing worker action', mockActionPath);
		expect(mockExecuteWorker).toHaveBeenCalledWith({
			init: 'not-a-function',
			work: mockAction.asWorker
		});
	});

	it('should skip action without asWorker function', async () => {
		const mockActionPath = '/test/path/worker3.js';
		const mockAction = {
			asWorkerInit: jest.fn()
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWorkers('/test/root', 'workers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing worker action', mockActionPath);
		expect(mockExecuteWorker).not.toHaveBeenCalled();
	});

	it('should process action with asWorker function and no asWorkerInit property', async () => {
		const mockActionPath = '/test/path/worker4.js';
		const mockAction = {
			asWorker: jest.fn()
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWorkers('/test/root', 'workers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing worker action', mockActionPath);
		expect(mockExecuteWorker).toHaveBeenCalledWith({
			work: mockAction.asWorker
		});
	});
});
