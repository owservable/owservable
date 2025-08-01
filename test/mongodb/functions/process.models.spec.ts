'use strict';

import processModels from '../../../src/mongodb/functions/process.models';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('@owservable/folders');
jest.mock('../../../src/mongodb/collections.models.map');

describe('process.models.ts tests', () => {
	let mockFs: jest.Mocked<typeof import('fs')>;
	let mockListSubfoldersByName: jest.MockedFunction<any>;
	let mockCollectionsModelsMap: jest.Mocked<any>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Get mocked modules
		mockFs = require('fs');
		mockListSubfoldersByName = require('@owservable/folders').listSubfoldersByName;
		mockCollectionsModelsMap = require('../../../src/mongodb/collections.models.map').default;
	});

	it('should exist and be a function', () => {
		const processModels = require('../../../src/mongodb/functions/process.models').default;
		expect(processModels).toBeDefined();
		expect(typeof processModels).toBe('function');
	});

	it('should call listSubfoldersByName with correct parameters', () => {
		const processModels = require('../../../src/mongodb/functions/process.models').default;
		mockListSubfoldersByName.mockReturnValue([]);

		processModels('/test/root', 'models');

		expect(mockListSubfoldersByName).toHaveBeenCalledWith('/test/root', 'models');
	});

	it('should handle empty folders array', () => {
		const processModels = require('../../../src/mongodb/functions/process.models').default;
		mockListSubfoldersByName.mockReturnValue([]);

		expect(() => processModels('/test/root', 'models')).not.toThrow();
		expect(mockListSubfoldersByName).toHaveBeenCalled();
	});

	it('should handle excluded folders', () => {
		const processModels = require('../../../src/mongodb/functions/process.models').default;
		mockListSubfoldersByName.mockReturnValue(['/test/models', '/test/excluded']);
		mockFs.readdirSync.mockReturnValue([]);

		processModels('/test/root', 'models', 'excluded');

		expect(mockListSubfoldersByName).toHaveBeenCalledWith('/test/root', 'models');
	});

	it('should process folders returned by listSubfoldersByName', () => {
		const processModels = require('../../../src/mongodb/functions/process.models').default;
		mockListSubfoldersByName.mockReturnValue(['/test/models1', '/test/models2']);
		mockFs.readdirSync.mockReturnValue([]);

		processModels('/test/root', 'models');

		expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
		expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models1');
		expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models2');
	});
});
