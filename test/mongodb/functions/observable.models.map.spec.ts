'use strict';

import {Model} from 'mongoose';
import ObservableModelsMap from '../../../src/mongodb/functions/observable.models.map';
import ObservableModel from '../../../src/mongodb/functions/observable.model';

jest.mock('../../../src/mongodb/functions/observable.model');

describe('observable.models.map tests', () => {
	let mockModel1: jest.Mocked<Model<any>>;
	let mockModel2: jest.Mocked<Model<any>>;
	let mockModel3: jest.Mocked<Model<any>>;

	beforeEach(() => {
		jest.clearAllMocks();

		(ObservableModelsMap as any)._instance = undefined;

		mockModel1 = {
			collection: {
				collectionName: 'collection1'
			}
		} as any;

		mockModel2 = {
			collection: {
				collectionName: 'collection2'
			}
		} as any;

		mockModel3 = {
			collection: {
				collectionName: 'collection1'
			}
		} as any;

		(ObservableModel as jest.MockedClass<typeof ObservableModel>).mockImplementation((collectionName: string) => {
			return {
				collectionName,
				_collection: collectionName
			} as any;
		});
	});

	describe('init', () => {
		it('should return an instance of ObservableModelsMap', () => {
			const instance: ObservableModelsMap = ObservableModelsMap.init();
			expect(instance).toBeInstanceOf(ObservableModelsMap);
		});

		it('should return the same instance on multiple calls (singleton)', () => {
			const instance1: ObservableModelsMap = ObservableModelsMap.init();
			const instance2: ObservableModelsMap = ObservableModelsMap.init();
			expect(instance1).toBe(instance2);
		});
	});

	describe('get', () => {
		it('should return an ObservableModel instance', () => {
			const result: ObservableModel = ObservableModelsMap.get(mockModel1);
			expect(result).toBeDefined();
			expect(ObservableModel).toHaveBeenCalledWith('collection1');
		});

		it('should return the same ObservableModel instance for the same collection name', () => {
			const result1: ObservableModel = ObservableModelsMap.get(mockModel1);
			const result2: ObservableModel = ObservableModelsMap.get(mockModel3);

			expect(result1).toBe(result2);
			expect(ObservableModel).toHaveBeenCalledTimes(1);
		});

		it('should return different ObservableModel instances for different collection names', () => {
			const result1: ObservableModel = ObservableModelsMap.get(mockModel1);
			const result2: ObservableModel = ObservableModelsMap.get(mockModel2);

			expect(result1).not.toBe(result2);
			expect(ObservableModel).toHaveBeenCalledTimes(2);
			expect(ObservableModel).toHaveBeenCalledWith('collection1');
			expect(ObservableModel).toHaveBeenCalledWith('collection2');
		});

		it('should cache ObservableModel instances in the internal map', () => {
			ObservableModelsMap.get(mockModel1);
			expect(ObservableModel).toHaveBeenCalledTimes(1);

			ObservableModelsMap.get(mockModel1);
			expect(ObservableModel).toHaveBeenCalledTimes(1);

			ObservableModelsMap.get(mockModel2);
			expect(ObservableModel).toHaveBeenCalledTimes(2);
		});
	});
});
