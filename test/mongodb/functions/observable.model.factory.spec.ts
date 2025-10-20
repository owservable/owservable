'use strict';

import {Model} from 'mongoose';
import observableModel from '../../../src/mongodb/functions/observable.model.factory';
import ObservableModel from '../../../src/mongodb/functions/observable.model';
import ObservableModelsMap from '../../../src/mongodb/functions/observable.models.map';

jest.mock('../../../src/mongodb/functions/observable.models.map');

describe('observable.model.factory tests', () => {
	let mockModel1: jest.Mocked<Model<any>>;
	let mockModel2: jest.Mocked<Model<any>>;
	let mockObservableModel1: any;
	let mockObservableModel2: any;
	let mockGetSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		mockModel1 = {
			collection: {
				collectionName: 'testCollection1'
			}
		} as any;

		mockModel2 = {
			collection: {
				collectionName: 'testCollection2'
			}
		} as any;

		mockObservableModel1 = {subscribe: jest.fn(), lifecycle: {subscribe: jest.fn()}} as any;
		mockObservableModel2 = {subscribe: jest.fn(), lifecycle: {subscribe: jest.fn()}} as any;

		mockGetSpy = jest.spyOn(ObservableModelsMap, 'get');
		mockGetSpy.mockImplementation((model: Model<any>) => {
			if (model.collection.collectionName === 'testCollection1') {
				return mockObservableModel1;
			}
			return mockObservableModel2;
		});
	});

	afterEach(() => {
		mockGetSpy.mockRestore();
	});

	it('should be a function', () => {
		expect(typeof observableModel).toBe('function');
	});

	it('should return an ObservableModel', () => {
		const result: ObservableModel = observableModel(mockModel1);
		expect(result).toBeDefined();
		expect(result.subscribe).toBeDefined();
		expect(result.lifecycle).toBeDefined();
	});

	it('should delegate to ObservableModelsMap.get with the correct model', () => {
		observableModel(mockModel1);
		expect(ObservableModelsMap.get).toHaveBeenCalledWith(mockModel1);
		expect(ObservableModelsMap.get).toHaveBeenCalledTimes(1);
	});

	it('should return the result from ObservableModelsMap.get', () => {
		const result: ObservableModel = observableModel(mockModel1);
		expect(result).toBe(mockObservableModel1);
	});

	it('should return different results for different models', () => {
		const result1: ObservableModel = observableModel(mockModel1);
		const result2: ObservableModel = observableModel(mockModel2);

		expect(result1).toBe(mockObservableModel1);
		expect(result2).toBe(mockObservableModel2);
		expect(result1).not.toBe(result2);
	});

	it('should call ObservableModelsMap.get each time it is invoked', () => {
		observableModel(mockModel1);
		observableModel(mockModel1);
		observableModel(mockModel2);

		expect(ObservableModelsMap.get).toHaveBeenCalledTimes(3);
		expect(ObservableModelsMap.get).toHaveBeenNthCalledWith(1, mockModel1);
		expect(ObservableModelsMap.get).toHaveBeenNthCalledWith(2, mockModel1);
		expect(ObservableModelsMap.get).toHaveBeenNthCalledWith(3, mockModel2);
	});
});
