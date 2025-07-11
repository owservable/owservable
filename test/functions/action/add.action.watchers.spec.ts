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
});
