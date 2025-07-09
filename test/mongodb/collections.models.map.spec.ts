'use strict';

import Dummy from './functions/_dummy';
import CollectionsModelsMap from '../../src/mongodb/collections.models.map';

describe('collections.models.map.ts tests', () => {
	it('CollectionsModelsMap exists', () => {
		expect(CollectionsModelsMap).toBeDefined();
		expect(typeof CollectionsModelsMap).toBe('function');
	});

	it('CollectionsModelsMap empty functionality', () => {
		let keys = CollectionsModelsMap.keys();
		expect(keys).toHaveLength(0);
		let values = CollectionsModelsMap.values();
		expect(values).toHaveLength(0);
		expect(CollectionsModelsMap.getModelByCollection(null)).toBeNull();

		CollectionsModelsMap.addCollectionToModelMapping(Dummy);
		keys = CollectionsModelsMap.keys();
		values = CollectionsModelsMap.values();
		expect(keys).toHaveLength(1);
		expect(values).toHaveLength(1);
		expect(CollectionsModelsMap.getModelByCollection('dummy')).toBe(Dummy);
	});
});

