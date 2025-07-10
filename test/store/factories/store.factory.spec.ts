'use strict';

import storeFactory from '../../../src/store/factories/store.factory';
import CollectionsModelsMap from '../../../src/mongodb/collections.models.map';
import CountStore from '../../../src/store/count.store';
import DocumentStore from '../../../src/store/document.store';
import CollectionStore from '../../../src/store/collection.store';

// Mock the dependencies
jest.mock('../../../src/mongodb/collections.models.map');
jest.mock('../../../src/store/count.store');
jest.mock('../../../src/store/document.store');
jest.mock('../../../src/store/collection.store');

const mockCollectionsModelsMap = CollectionsModelsMap as jest.Mocked<typeof CollectionsModelsMap>;
const MockCountStore = CountStore as jest.MockedClass<typeof CountStore>;
const MockDocumentStore = DocumentStore as jest.MockedClass<typeof DocumentStore>;
const MockCollectionStore = CollectionStore as jest.MockedClass<typeof CollectionStore>;

describe('store.factory.ts tests', () => {
	const mockModel = {} as any; // Mock Mongoose model
	const testObserve = 'testCollection';
	const testTarget = 'testTarget';

	beforeEach(() => {
		jest.clearAllMocks();
		mockCollectionsModelsMap.getModelByCollection.mockReturnValue(mockModel);
	});

	it('should be defined', () => {
		expect(storeFactory).toBeDefined();
		expect(typeof storeFactory).toBe('function');
	});

	it('should return CountStore for "count" scope', () => {
		const mockCountInstance = {} as CountStore;
		MockCountStore.mockImplementation(() => mockCountInstance);

		const result = storeFactory('count', testObserve, testTarget);

		expect(mockCollectionsModelsMap.getModelByCollection).toHaveBeenCalledWith(testObserve);
		expect(MockCountStore).toHaveBeenCalledWith(mockModel, testTarget);
		expect(result).toBe(mockCountInstance);
	});

	it('should return CollectionStore for "many" scope', () => {
		const mockCollectionInstance = {} as CollectionStore;
		MockCollectionStore.mockImplementation(() => mockCollectionInstance);

		const result = storeFactory('many', testObserve, testTarget);

		expect(mockCollectionsModelsMap.getModelByCollection).toHaveBeenCalledWith(testObserve);
		expect(MockCollectionStore).toHaveBeenCalledWith(mockModel, testTarget);
		expect(result).toBe(mockCollectionInstance);
	});

	it('should return DocumentStore for "one" scope', () => {
		const mockDocumentInstance = {} as DocumentStore;
		MockDocumentStore.mockImplementation(() => mockDocumentInstance);

		const result = storeFactory('one', testObserve, testTarget);

		expect(mockCollectionsModelsMap.getModelByCollection).toHaveBeenCalledWith(testObserve);
		expect(MockDocumentStore).toHaveBeenCalledWith(mockModel, testTarget);
		expect(result).toBe(mockDocumentInstance);
	});

	it('should return DocumentStore for any other scope (default case)', () => {
		const mockDocumentInstance = {} as DocumentStore;
		MockDocumentStore.mockImplementation(() => mockDocumentInstance);

		// Test with an invalid scope to ensure default case works
		const result = storeFactory('invalid' as any, testObserve, testTarget);

		expect(mockCollectionsModelsMap.getModelByCollection).toHaveBeenCalledWith(testObserve);
		expect(MockDocumentStore).toHaveBeenCalledWith(mockModel, testTarget);
		expect(result).toBe(mockDocumentInstance);
	});

	it('should handle different observe and target parameters', () => {
		const mockDocumentInstance = {} as DocumentStore;
		MockDocumentStore.mockImplementation(() => mockDocumentInstance);

		const differentObserve = 'differentCollection';
		const differentTarget = 'differentTarget';

		storeFactory('one', differentObserve, differentTarget);

		expect(mockCollectionsModelsMap.getModelByCollection).toHaveBeenCalledWith(differentObserve);
		expect(MockDocumentStore).toHaveBeenCalledWith(mockModel, differentTarget);
	});
});
