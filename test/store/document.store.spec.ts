'use strict';

import * as _ from 'lodash';
import {Model} from 'mongoose';

import DocumentStore from '../../src/store/document.store';
import EStoreType from '../../src/_enums/store.type.enum';
import getHrtimeAsNumber from '../../src/functions/performance/get.hrtime.as.number';
import observableModel from '../../src/mongodb/functions/observable.model';
import getMillisecondsFrom from '../../src/functions/performance/get.milliseconds.from';

// Mock external dependencies
jest.mock('../../src/mongodb/functions/observable.model');
jest.mock('../../src/functions/performance/get.hrtime.as.number');
jest.mock('../../src/functions/performance/get.milliseconds.from');

describe('DocumentStore tests', () => {
	let mockModel: jest.Mocked<Model<any>>;
	let mockStore: DocumentStore;
	let mockObservableModel: jest.MockedFunction<typeof observableModel>;
	let mockGetHrtimeAsNumber: jest.MockedFunction<typeof getHrtimeAsNumber>;
	let mockGetMillisecondsFrom: jest.MockedFunction<typeof getMillisecondsFrom>;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Mock dependencies
		mockModel = {
			findOne: jest.fn(),
			findById: jest.fn(),
			find: jest.fn(),
			populate: jest.fn(),
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
				unsubscribe: jest.fn(),
			}),
		};
		mockObservableModel.mockReturnValue(mockObservable as any);

		// Create store instance
		mockStore = new DocumentStore(mockModel, 'testDocument');
	});

	describe('constructor', () => {
		it('should initialize with correct default values', () => {
			expect(mockStore.target).toBe('testDocument');
			expect((mockStore as any)._type).toBe(EStoreType.DOCUMENT);
		});
	});

	describe('shouldReload', () => {
		beforeEach(() => {
			mockStore.config = {
				query: {_id: 'test-id'},
				strict: false,
				incremental: false,
			} as any;
		});

		it('should return true for initial subscription', () => {
			const change = {};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true for delete operation', () => {
			const change = {
				operationType: 'delete',
				documentKey: {_id: 'test-id'},
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false for insert operation with ID query', () => {
			const change = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should return true for insert operation without ID query', () => {
			mockStore.config = {
				query: {name: 'test'},
				strict: false,
				incremental: false,
			} as any;
			const change = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if no updateDescription', () => {
			const change = {
				operationType: 'update',
				documentKey: {_id: 'test-id'},
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if document key matches query ID', () => {
			const change = {
				operationType: 'update',
				documentKey: {_id: 'test-id'},
				updateDescription: {
					updatedFields: {name: 'updated'},
					removedFields: [] as string[],
				},
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if should not consider fields', () => {
			jest.spyOn(mockStore as any, 'shouldConsiderFields').mockReturnValue(false);
			const change = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {
					updatedFields: {name: 'updated'},
					removedFields: [] as string[],
				},
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if field intersections exist', () => {
			jest.spyOn(mockStore as any, 'shouldConsiderFields').mockReturnValue(true);
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1, email: 1},
				strict: false,
				incremental: false,
			} as any;
			const change = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {
					updatedFields: {name: 'updated'},
					removedFields: [] as string[],
				},
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false if no field intersections', () => {
			jest.spyOn(mockStore as any, 'shouldConsiderFields').mockReturnValue(true);
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1, email: 1},
				strict: false,
				incremental: false,
			} as any;
			const change = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {
					updatedFields: {description: 'updated'},
					removedFields: [] as string[],
				},
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});
	});

	describe('private loading methods', () => {
		beforeEach(() => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: [],
			} as any;
		});

		it('should load document by ID', async () => {
			const document = {_id: 'test-id', name: 'test'};
			mockModel.findById.mockResolvedValue(document);

			const result = await (mockStore as any)._loadDocumentById('test-id');

			expect(mockModel.findById).toHaveBeenCalledWith('test-id', {name: 1});
			expect(result).toBe(document);
		});

		it('should load document by query', async () => {
			const document = {_id: 'test-id', name: 'test'};
			mockModel.findOne.mockResolvedValue(document);

			const result = await (mockStore as any)._loadDocument();

			expect(mockModel.findOne).toHaveBeenCalledWith({_id: 'test-id'}, {name: 1});
			expect(result).toBe(document);
		});

		it('should load sorted first document', async () => {
			const documents = [{_id: 'test-id', name: 'test'}];
			const mockQuery = {
				sort: jest.fn().mockReturnThis(),
				setOptions: jest.fn().mockResolvedValue(documents),
			};

			mockModel.find.mockReturnValue(mockQuery as any);
			mockStore.config = {
				query: {status: 'active'},
				fields: {name: 1},
				sort: {createdAt: -1},
				paging: {skip: 0, limit: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: [],
			} as any;

			const result = await (mockStore as any)._loadSortedFirstDocument();

			expect(mockModel.find).toHaveBeenCalledWith({status: 'active'}, {name: 1}, {skip: 0, limit: 1});
			expect(mockQuery.sort).toHaveBeenCalledWith({createdAt: -1});
			expect(mockQuery.setOptions).toHaveBeenCalledWith({allowDiskUse: true});
			expect(result).toBe(documents[0]);
		});
	});

	describe('_pipeFilter', () => {
		beforeEach(() => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: [],
			} as any;
		});

		it('should return true for sorted queries', () => {
			mockStore.config = {
				query: {status: 'active'},
				sort: {createdAt: -1},
				strict: false,
				incremental: false,
			} as any;

			const change = {operationType: 'update'};
			const result = (mockStore as any)._pipeFilter(change);

			expect(result).toBe(true);
		});

		it('should return true for delete operations', () => {
			const change = {operationType: 'delete'};
			const result = (mockStore as any)._pipeFilter(change);

			expect(result).toBe(true);
		});

		it('should return true if document key matches query ID', () => {
			const change = {
				operationType: 'update',
				documentKey: {_id: 'test-id'},
			};
			const result = (mockStore as any)._pipeFilter(change);

			expect(result).toBe(true);
		});

		it('should return testDocument result for other cases', () => {
			const change = {
				operationType: 'update',
				documentKey: {_id: 'other-id'},
				fullDocument: {_id: 'other-id', name: 'test'},
			};
			jest.spyOn(mockStore as any, 'testDocument').mockReturnValue(true);

			const result = (mockStore as any)._pipeFilter(change);

			expect(result).toBe(true);
			expect((mockStore as any).testDocument).toHaveBeenCalledWith({_id: 'other-id', name: 'test'});
		});
	});

	describe('load', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitOne').mockImplementation();
			jest.spyOn(mockStore as any, 'emitDelete').mockImplementation();
			jest.spyOn(mockStore as any, 'emitError').mockImplementation();
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			jest.spyOn(mockStore as any, '_loadDocumentById').mockImplementation();
			jest.spyOn(mockStore as any, '_loadDocument').mockImplementation();
			jest.spyOn(mockStore as any, '_loadSortedFirstDocument').mockImplementation();
			
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: [],
			} as any;
		});

		it('should emit one if no config', async () => {
			(mockStore as any)._config = {};
			(mockStore as any)._subscriptionId = 'test-sub';

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(1000, 'test-sub');
		});

		it('should return early if should not reload', async () => {
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(false);

			await (mockStore as any).load({});

			expect((mockStore as any)._loadDocument).not.toHaveBeenCalled();
		});

		it('should emit delete for delete operation with matching ID', async () => {
			const change = {
				operationType: 'delete',
				documentKey: {_id: 'test-id'},
			};

			await (mockStore as any).load(change);

			expect((mockStore as any).emitDelete).toHaveBeenCalledWith(1000, expect.any(String), 'test-id');
		});

		it('should load document with sort', async () => {
			const document = {
				_id: 'test-id',
				name: 'test',
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test'}),
			};

			jest.spyOn(mockStore as any, '_loadSortedFirstDocument').mockResolvedValue(document);
			mockStore.config = {
				query: {status: 'active'},
				sort: {createdAt: -1},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: [],
			} as any;

			await (mockStore as any).load({});

			expect((mockStore as any)._loadSortedFirstDocument).toHaveBeenCalled();
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(1000, expect.any(String), {_id: 'test-id', name: 'test'});
		});

		it('should load document by ID when query has _id', async () => {
			const document = {
				_id: 'test-id',
				name: 'test',
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test'}),
			};

			jest.spyOn(mockStore as any, '_loadDocumentById').mockResolvedValue(document);

			await (mockStore as any).load({});

			expect((mockStore as any)._loadDocumentById).toHaveBeenCalledWith('test-id');
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(1000, expect.any(String), {_id: 'test-id', name: 'test'});
		});

		it('should load document by query when no ID', async () => {
			const document = {
				_id: 'test-id',
				name: 'test',
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test'}),
			};

			jest.spyOn(mockStore as any, '_loadDocument').mockResolvedValue(document);
			mockStore.config = {
				query: {status: 'active'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: [],
			} as any;

			await (mockStore as any).load({});

			expect((mockStore as any)._loadDocument).toHaveBeenCalled();
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(1000, expect.any(String), {_id: 'test-id', name: 'test'});
		});

		it('should handle populates', async () => {
			const document = {
				_id: 'test-id',
				name: 'test',
				populate: jest.fn().mockResolvedValue(undefined),
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test'}),
			};

			jest.spyOn(mockStore as any, '_loadDocumentById').mockResolvedValue(document);
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: ['user', 'category'],
				virtuals: [],
			} as any;

			await (mockStore as any).load({});

			expect(document.populate).toHaveBeenCalledWith('user');
			expect(document.populate).toHaveBeenCalledWith('category');
		});

		it('should handle virtuals', async () => {
			const document = {
				_id: 'test-id',
				name: 'test',
				fullName: Promise.resolve('Test Full Name'),
				toJSON: jest.fn().mockReturnValue({_id: 'test-id', name: 'test', fullName: 'Test Full Name'}),
			};

			jest.spyOn(mockStore as any, '_loadDocumentById').mockResolvedValue(document);
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: ['fullName'],
			} as any;

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(1000, expect.any(String), {
				_id: 'test-id',
				name: 'test',
				fullName: 'Test Full Name',
			});
		});

		it('should emit one with undefined if no data found', async () => {
			jest.spyOn(mockStore as any, '_loadDocumentById').mockResolvedValue(null);

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(1000, expect.any(String));
		});

		it('should handle errors', async () => {
			const error = new Error('Test error');
			jest.spyOn(mockStore as any, '_loadDocumentById').mockRejectedValue(error);

			await (mockStore as any).load({});

			expect((mockStore as any).emitError).toHaveBeenCalledWith(1000, expect.any(String), error);
		});
	});

	describe('extractFromConfig', () => {
		it('should extract paging configuration with skip', () => {
			const config = {
				query: {_id: 'test-id'},
				skip: 10,
				strict: false,
				incremental: false,
			};

			mockStore.config = config as any;

			expect((mockStore as any)._paging).toEqual({});
		});

		it('should set paging to default when no skip', () => {
			const config = {
				query: {_id: 'test-id'},
				strict: false,
				incremental: false,
			};

			mockStore.config = config as any;

			expect((mockStore as any)._paging).toEqual({skip: 0, limit: 1});
		});

		it('should handle skip value of 0', () => {
			const config = {
				query: {_id: 'test-id'},
				skip: 0,
				strict: false,
				incremental: false,
			};

			mockStore.config = config as any;

			expect((mockStore as any)._paging).toEqual({skip: 0, limit: 1});
		});
	});
});
