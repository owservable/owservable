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

	it('should be a function', () => {
		expect(typeof addActionWatchers).toBe('function');
	});

	it('should handle actions with asWatcher method', () => {
		const mockActionPath = '/path/to/watcher.js';
		const mockAction = {
			asWatcher: jest.fn(),
			asWatcherInit: jest.fn()
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'watchers');
		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing watcher action', mockActionPath);
		expect(MockActionClass).toHaveBeenCalled();
		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			init: mockAction.asWatcherInit,
			watch: mockAction.asWatcher
		});
	});

	it('should handle actions with asWatcher method but no asWatcherInit', () => {
		const mockActionPath = '/path/to/watcher2.js';
		const mockAction = {
			asWatcher: jest.fn()
			// No asWatcherInit method
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			watch: mockAction.asWatcher
		});
	});

	it('should skip actions without asWatcher method', () => {
		const mockActionPath = '/path/to/invalid-watcher.js';
		const mockAction = {
			// No asWatcher method
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).not.toHaveBeenCalled();
	});

	it('should handle actions with asWatcherInit as non-function', () => {
		const mockActionPath = '/path/to/watcher3.js';
		const mockAction = {
			asWatcher: jest.fn(),
			asWatcherInit: 'not-a-function' // Non-function value
		};
		const MockActionClass = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);

		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			init: 'not-a-function',
			watch: mockAction.asWatcher
		});
	});
});
