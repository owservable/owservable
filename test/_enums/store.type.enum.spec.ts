'use strict';

import EStoreType from '../../src/_enums/store.type.enum';

describe('store.type.enum.ts tests', () => {
	it('test EStoreType fields', () => {
		expect(EStoreType).toBeDefined();
		expect(typeof EStoreType).toBe('object');
		expect(EStoreType.DOCUMENT).toBe(0);
		expect(EStoreType.COLLECTION).toBe(1);
		expect(EStoreType.COUNT).toBe(2);
	});
});
