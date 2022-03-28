import {expect} from 'chai';

import Dummy from './functions/_dummy';
import CollectionsModelsMap from '../../src/mongodb/collections.models.map';

describe('collections.models.map.ts tests', () => {
	it('CollectionsModelsMap exists', () => {
		expect(CollectionsModelsMap).to.be.an('function');
	});

	it('CollectionsModelsMap empty functionality', () => {
		let keys = CollectionsModelsMap.keys();
		expect(keys).to.be.empty;
		let values = CollectionsModelsMap.values();
		expect(values).to.be.empty;
		expect(CollectionsModelsMap.getModelByCollection(null)).to.be.null;

		CollectionsModelsMap.addCollectionToModelMapping(Dummy);
		keys = CollectionsModelsMap.keys();
		values = CollectionsModelsMap.values();
		expect(keys).to.have.length(1);
		expect(values).to.have.length(1);
		expect(CollectionsModelsMap.getModelByCollection('dummy')).to.be.equal(Dummy);
	});
});
