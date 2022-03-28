import {expect} from 'chai';
import EStoreType from '../../src/_enums/store.type.enum';

describe('store.type.enum.ts tests', () => {
	it('test EStoreType fields', () => {
		expect(EStoreType).to.be.an('object');
		expect(EStoreType.DOCUMENT).to.be.equal(0);
		expect(EStoreType.COLLECTION).to.be.equal(1);
		expect(EStoreType.COUNT).to.be.equal(2);
	});
});