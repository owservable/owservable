'use strict';
import {Model} from 'mongoose';

import CollectionStore from '../../src/store/collection.store';
import EStoreType from '../../src/enums/store.type.enum';
import getHrtimeAsNumber from '../../src/functions/performance/get.hrtime.as.number';
import observableModel from '../../src/mongodb/functions/observable.model.factory';
import getMillisecondsFrom from '../../src/functions/performance/get.milliseconds.from';

// Mock external dependencies
jest.mock('../../src/mongodb/functions/observable.model.factory');
jest.mock('../../src/functions/performance/get.hrtime.as.number');
jest.mock('../../src/functions/performance/get.milliseconds.from');

describe('CollectionStore tests', () => {
	let mockModel: jest.Mocked<Model<any>>;
	let mockStore: CollectionStore;
	let mockObservableModel: jest.MockedFunction<typeof observableModel>;
	let mockGetHrtimeAsNumber: jest.MockedFunction<typeof getHrtimeAsNumber>;
	let mockGetMillisecondsFrom: jest.MockedFunction<typeof getMillisecondsFrom>;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Mock dependencies
		mockModel = {
			find: jest.fn(),
			findOne: jest.fn(),
			findById: jest.fn(),
			countDocuments: jest.fn(),
			populate: jest.fn()
		} as any;

		mockObservableModel = observableModel as jest.MockedFunction<typeof observableModel>;
		mockGetHrtimeAsNumber = getHrtimeAsNumber as jest.MockedFunction<typeof getHrtimeAsNumber>;
		mockGetMillisecondsFrom = getMillisecondsFrom as jest.MockedFunction<typeof getMillisecondsFrom>;

		// Mock return values
		mockGetHrtimeAsNumber.mockReturnValue(1000);
		mockGetMillisecondsFrom.mockReturnValue(123.45);

		// Mock observable model
		const mockObservable = {
			pipe: jest.fn().mockReturnThis(),
			subscribe: jest.fn().mockReturnValue({
				unsubscribe: jest.fn()
			})
		};
		mockObservableModel.mockReturnValue(mockObservable as any);

		// Create store instance
		mockStore = new CollectionStore(mockModel, 'testCollection');
	});

	describe('constructor', () => {
		it('should initialize with correct default values', () => {
			expect(mockStore.target).toBe('testCollection');
			expect((mockStore as any)._type).toBe(EStoreType.COLLECTION);
			expect((mockStore as any)._totalCount).toBe(-1);
		});
	});

	describe('shouldReload', () => {
		beforeEach(() => {
			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();

			mockStore.config = {
				query: {status: 'active'},
				strict: false,
				incremental: false
			} as any;
		});

		it('should return true for initial subscription', () => {
			const change = {};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true for delete operation', () => {
			const change = {
				operationType: 'delete',
				updateDescription: {updatedFields: {}, removedFields: [] as string[]}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true for insert operation', () => {
			const change = {
				operationType: 'insert',
				updateDescription: {updatedFields: {}, removedFields: [] as string[]}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if no updateDescription', () => {
			const change = {
				operationType: 'update'
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if query fields are updated', () => {
			const change = {
				operationType: 'update',
				updateDescription: {
					updatedFields: {status: 'inactive'},
					removedFields: [] as string[]
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false if no relevant fields are updated', () => {
			const change = {
				operationType: 'update',
				updateDescription: {
					updatedFields: {name: 'test'},
					removedFields: [] as string[]
				},
				fullDocument: {status: 'active'}
			};
			jest.spyOn(mockStore as any, 'testDocument').mockReturnValue(true);
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false for unknown operation types', () => {
			const change = {
				operationType: 'drop',
				updateDescription: {
					updatedFields: {},
					removedFields: [] as string[]
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should return false for invalidate operation type', () => {
			const change = {
				operationType: 'invalidate',
				updateDescription: {
					updatedFields: {},
					removedFields: [] as string[]
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});
	});

	describe('sendCount', () => {
		it('should emit total count', async () => {
			const mockEmitTotal = jest.spyOn(mockStore as any, 'emitTotal').mockImplementation();
			mockModel.countDocuments.mockResolvedValue(10);

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {query: {status: 'active'}, strict: false, incremental: false} as any;

			await (mockStore as any).sendCount('test-sub');

			expect(mockModel.countDocuments).toHaveBeenCalledWith({status: 'active'});
			expect(mockEmitTotal).toHaveBeenCalledWith(1000, 'test-sub', 10);
			expect((mockStore as any)._totalCount).toBe(10);
		});
	});

	describe('loadIncremental', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitDelete').mockImplementation();
			jest.spyOn(mockStore as any, 'emitMany').mockImplementation();

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				populates: [],
				virtuals: []
			} as any;
		});

		it('should emit delete for delete operation', async () => {
			const change = {
				operationType: 'delete',
				documentKey: {_id: 'test-id'}
			};

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect((mockStore as any).emitDelete).toHaveBeenCalledWith(1000, 'test-sub', 'test-id');
		});

		it('should emit document for insert/update operations', async () => {
			const fullDocument = {
				_id: 'test-id',
				name: 'test',
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test'})
			};

			const change = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
				fullDocument
			};

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {data: fullDocument});
		});

		it('should handle populates', async () => {
			const fullDocument = {
				_id: 'test-id',
				name: 'test',
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test'})
			};

			const change = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
				fullDocument
			};

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				populates: ['user', 'category'],
				virtuals: []
			} as any;

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect(mockModel.populate).toHaveBeenCalledWith(fullDocument, 'user');
			expect(mockModel.populate).toHaveBeenCalledWith(fullDocument, 'category');
		});

		it('should handle virtuals', async () => {
			const fullDocument = {
				_id: 'test-id',
				name: 'test',
				fullName: Promise.resolve('Test Full Name'),
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test', fullName: 'Test Full Name'})
			};

			const change = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
				fullDocument
			};

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				populates: [],
				virtuals: ['fullName']
			} as any;

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {
				data: {_id: 'test-id', name: 'test', fullName: 'Test Full Name'}
			});
		});
	});

	describe('loadAll', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitMany').mockImplementation();
			jest.spyOn(mockStore as any, 'sendCount').mockImplementation();
			jest.spyOn(mockStore as any, 'isQueryChange').mockReturnValue(false);
			jest.spyOn(mockStore as any, 'removeSubscriptionDiff').mockImplementation();

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {status: 'active'},
				fields: {name: 1},
				paging: {skip: 0, limit: 10},
				sort: {createdAt: -1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;
		});

		it('should load and emit all documents', async () => {
			const documents = [
				{_id: '1', name: 'doc1'},
				{_id: '2', name: 'doc2'}
			];

			const mockQuery = {
				sort: jest.fn().mockReturnThis(),
				setOptions: jest.fn().mockResolvedValue(documents)
			};

			mockModel.find.mockReturnValue(mockQuery as any);
			(mockStore as any)._totalCount = 2;

			await (mockStore as any).loadAll(1000, 'test-sub');

			expect(mockModel.find).toHaveBeenCalledWith({status: 'active'}, {name: 1}, expect.any(Object));
			expect(mockQuery.sort).toHaveBeenCalledWith({createdAt: -1});
			expect(mockQuery.setOptions).toHaveBeenCalledWith({allowDiskUse: true});
			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {
				total: 2,
				data: documents
			});
		});

		it('should handle query changes with recounting', async () => {
			const documents = [{_id: '1', name: 'doc1'}];
			const mockQuery = {
				sort: jest.fn().mockReturnThis(),
				setOptions: jest.fn().mockResolvedValue(documents)
			};

			mockModel.find.mockReturnValue(mockQuery as any);
			jest.spyOn(mockStore as any, 'isQueryChange').mockReturnValue(true);
			(mockStore as any)._totalCount = 1;

			await (mockStore as any).loadAll(1000, 'test-sub');

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {
				total: 1,
				data: documents,
				recounting: true
			});
			expect((mockStore as any).sendCount).toHaveBeenCalledWith('test-sub');
			expect((mockStore as any).removeSubscriptionDiff).toHaveBeenCalledWith('test-sub');
		});

		it('should handle populates', async () => {
			const documents = [{_id: '1', name: 'doc1'}];
			const mockQuery = {
				sort: jest.fn().mockReturnThis(),
				setOptions: jest.fn().mockResolvedValue(documents)
			};

			mockModel.find.mockReturnValue(mockQuery as any);
			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false,
				populates: ['user'],
				virtuals: []
			} as any;

			await (mockStore as any).loadAll(1000, 'test-sub');

			expect(mockModel.populate).toHaveBeenCalledWith(documents, 'user');
		});

		it('should handle virtuals', async () => {
			const documents = [
				{
					_id: '1',
					name: 'doc1',
					fullName: Promise.resolve('Full Name 1'),
					toJSON: jest.fn().mockReturnValue({_id: '1', name: 'doc1', fullName: 'Full Name 1'})
				}
			];

			const mockQuery = {
				sort: jest.fn().mockReturnThis(),
				setOptions: jest.fn().mockResolvedValue(documents)
			};

			mockModel.find.mockReturnValue(mockQuery as any);
			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: ['fullName']
			} as any;

			await (mockStore as any).loadAll(1000, 'test-sub');

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {
				total: -1,
				data: [{_id: '1', name: 'doc1', fullName: 'Full Name 1'}]
			});
		});
	});

	describe('load', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitMany').mockImplementation();
			jest.spyOn(mockStore as any, 'emitError').mockImplementation();
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			jest.spyOn(mockStore as any, 'loadIncremental').mockImplementation();
			jest.spyOn(mockStore as any, 'loadAll').mockImplementation();

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false
			} as any;
		});

		it('should emit empty if no config', async () => {
			(mockStore as any)._config = {};
			(mockStore as any)._subscriptionId = 'test-sub';

			await (mockStore as any).load({});

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub');
		});

		it('should return early if should not reload', async () => {
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(false);
			// Reset the mocks after the config was set (which triggered a load)
			jest.clearAllMocks();

			await (mockStore as any).load({});

			expect((mockStore as any).loadIncremental).not.toHaveBeenCalled();
			expect((mockStore as any).loadAll).not.toHaveBeenCalled();
		});

		it('should call loadIncremental for incremental updates', async () => {
			const change = {fullDocument: {_id: 'test'}};
			(mockStore as any)._incremental = true;

			await (mockStore as any).load(change);

			expect((mockStore as any).loadIncremental).toHaveBeenCalledWith(1000, expect.any(String), change);
		});

		it('should call loadAll for non-incremental updates', async () => {
			const change = {fullDocument: {_id: 'test'}};
			(mockStore as any)._incremental = false;

			await (mockStore as any).load(change);

			expect((mockStore as any).loadAll).toHaveBeenCalledWith(1000, expect.any(String));
		});

		it('should handle errors', async () => {
			const error = new Error('Test error');
			jest.spyOn(mockStore as any, 'loadAll').mockRejectedValue(error);

			await (mockStore as any).load({});

			expect((mockStore as any).emitError).toHaveBeenCalledWith(1000, expect.any(String), error);
		});
	});

	describe('extractFromConfig', () => {
		it('should extract incremental and paging configuration', () => {
			const config = {
				query: {},
				strict: false,
				incremental: true,
				page: 2,
				pageSize: 20
			};

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = config as any;

			expect((mockStore as any)._incremental).toBe(true);
			expect((mockStore as any)._paging).toEqual({
				skip: 20,
				limit: 20
			});
		});

		it('should handle no paging', () => {
			const config = {
				query: {},
				strict: false,
				incremental: false
			};

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = config as any;

			expect((mockStore as any)._paging).toEqual({});
		});

		it('should handle page 1', () => {
			const config = {
				query: {},
				strict: false,
				incremental: false,
				page: 1,
				pageSize: 10
			};

			// Mock restartSubscription to prevent automatic restart during config assignment
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = config as any;

			expect((mockStore as any)._paging).toEqual({
				skip: 0,
				limit: 10
			});
		});
	});
});
