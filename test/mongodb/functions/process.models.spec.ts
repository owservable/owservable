'use strict';

import Dummy from './_dummy';
import processModels from '../../../src/mongodb/functions/process.models';
import CollectionsModelsMap from '../../../src/mongodb/collections.models.map';

describe('process.models.ts tests', () => {
	it('processModels exists', () => {
		expect(processModels).toBeDefined();
		expect(typeof processModels).toBe('function');
	});
	
	it('basic functionality test', () => {
		// Test basic functionality without accessing private functions
		expect(CollectionsModelsMap).toBeDefined();
		expect(typeof CollectionsModelsMap.keys).toBe('function');
		expect(typeof CollectionsModelsMap.values).toBe('function');
		expect(typeof CollectionsModelsMap.getModelByCollection).toBe('function');
	});

	it.todo('should be implemented');
});


