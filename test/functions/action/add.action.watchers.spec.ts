'use strict';

import addActionWatchers from '../../../src/functions/action/add.action.watchers';

// Mock the external dependencies
jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../src/functions/execute/execute.watcher', () => ({
	default: jest.fn()
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;
const mockExecuteWatcher = require('../../../src/functions/execute/execute.watcher').default;

describe('addActionWatchers tests', () => {
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

	it('should process action with asWatcher function and init function', async () => {
		const mockActionPath = '/test/path/watcher1.js';
		const mockAction = {
			asWatcher: jest.fn(),
			asWatcherInit: jest.fn().mockReturnValue({ some: 'init' })
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWatchers('/test/root', 'watchers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing watcher action', mockActionPath);
		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			init: { some: 'init' },
			watch: mockAction.asWatcher
		});
	});

	it('should process action with asWatcher function but no init function', async () => {
		const mockActionPath = '/test/path/watcher2.js';
		const mockAction = {
			asWatcher: jest.fn(),
			asWatcherInit: 'not-a-function'
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWatchers('/test/root', 'watchers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing watcher action', mockActionPath);
		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			init: 'not-a-function',
			watch: mockAction.asWatcher
		});
	});

	it('should skip action without asWatcher function', async () => {
		const mockActionPath = '/test/path/watcher3.js';
		const mockAction = {
			asWatcherInit: jest.fn()
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWatchers('/test/root', 'watchers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing watcher action', mockActionPath);
		expect(mockExecuteWatcher).not.toHaveBeenCalled();
	});

	it('should process action with asWatcher function and no asWatcherInit property', async () => {
		const mockActionPath = '/test/path/watcher4.js';
		const mockAction = {
			asWatcher: jest.fn()
		};
		const mockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockResolvedValue([mockActionPath]);
		
		// Mock require to return our mock action class
		jest.doMock(mockActionPath, () => ({ default: mockActionClass }), { virtual: true });

		await addActionWatchers('/test/root', 'watchers');

		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing watcher action', mockActionPath);
		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			watch: mockAction.asWatcher
		});
	});
});
