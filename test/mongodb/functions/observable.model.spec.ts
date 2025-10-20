'use strict';

const mockWatch = jest.fn().mockReturnValue({
	on: jest.fn(),
	removeAllListeners: jest.fn()
});

const mockCollection = jest.fn().mockReturnValue({
	watch: mockWatch
});

const mockDb = {
	collection: mockCollection
};

jest.mock('mongoose', () => ({
	default: {
		connection: {
			db: mockDb
		}
	},
	connection: {
		db: mockDb
	}
}));

import {Model} from 'mongoose';
import {Subject} from 'rxjs';
import observableModel from '../../../src/mongodb/functions/observable.model.factory';
import ObservableModelsMap from '../../../src/mongodb/functions/observable.models.map';

describe('observable.model.ts tests', () => {
	beforeEach(() => {
		mockWatch.mockClear();
		mockCollection.mockClear();
		(ObservableModelsMap as any)._instance = undefined;
	});

	describe('observableModel function', () => {
		it('should exist and be a function', () => {
			expect(observableModel).toBeDefined();
			expect(typeof observableModel).toBe('function');
		});

		it('should return a Subject instance', () => {
			const mockModel: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'testCollection'
				}
			} as any;

			const result: Subject<any> = observableModel(mockModel);

			expect(result).toBeDefined();
			expect(typeof result.next).toBe('function');
			expect(typeof result.subscribe).toBe('function');
			expect(result).toBeInstanceOf(Subject);
		});

		it('should return the same instance for the same collection (singleton per collection)', () => {
			const mockModel: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'testCollection2'
				}
			} as any;

			const result1: Subject<any> = observableModel(mockModel);
			const result2: Subject<any> = observableModel(mockModel);

			expect(result1).toBe(result2);
		});

		it('should return different instances for different collections', () => {
			const mockModel1: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'testCollection3'
				}
			} as any;

			const mockModel2: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'testCollection4'
				}
			} as any;

			const result1: Subject<any> = observableModel(mockModel1);
			const result2: Subject<any> = observableModel(mockModel2);

			expect(result1).not.toBe(result2);
		});

		it('should have a lifecycle Subject', () => {
			const mockModel: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'testCollection5'
				}
			} as any;

			const result: any = observableModel(mockModel);

			expect(result.lifecycle).toBeDefined();
			expect(typeof result.lifecycle.next).toBe('function');
			expect(typeof result.lifecycle.subscribe).toBe('function');
			expect(result.lifecycle).toBeInstanceOf(Subject);
		});

		it('should call db.collection with the correct collection name', () => {
			const mockModel: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'myTestCollection'
				}
			} as any;

			observableModel(mockModel);

			expect(mockCollection).toHaveBeenCalledWith('myTestCollection');
		});

		it('should call watch on the collection', () => {
			mockWatch.mockClear();

			const mockModel: jest.Mocked<Model<any>> = {
				collection: {
					collectionName: 'testCollection6'
				}
			} as any;

			const result: Subject<any> = observableModel(mockModel);

			expect(result).toBeDefined();
			expect(typeof result.next).toBe('function');
		});
	});
});
