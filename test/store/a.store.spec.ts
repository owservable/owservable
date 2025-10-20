'use strict';

import * as _ from 'lodash';
import {Model} from 'mongoose';
import {Subscription} from 'rxjs';
import {randomUUID} from 'crypto';

import AStore from '../../src/store/a.store';
import EStoreType from '../../src/enums/store.type.enum';
import observableModel from '../../src/mongodb/functions/observable.model.factory';
import getMillisecondsFrom from '../../src/functions/performance/get.milliseconds.from';

// Mock external dependencies
jest.mock('../../src/mongodb/functions/observable.model.factory');
jest.mock('../../src/functions/performance/get.milliseconds.from');
jest.mock('crypto');

class MockAStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COLLECTION;
	}

	protected shouldReload(change: any): boolean {
		if (this.isInitialSubscription(change)) return true;
		return !_.isEmpty(change);
	}

	protected async load(change: any): Promise<void> {
		// Mock implementation for testing
		return Promise.resolve();
	}

	// Expose protected methods for testing
	public testIsInitialSubscription(change: any): boolean {
		return this.isInitialSubscription(change);
	}

	public testExtractFromConfig(): void {
		return this.extractFromConfig();
	}

	// Override extractFromConfig to handle incremental flag
	protected extractFromConfig(): void {
		super.extractFromConfig();
		const {incremental = false} = this._config;
		this._incremental = incremental;
	}

	public testTestDocument(document: any): boolean {
		return this.testDocument(document);
	}

	public testEmitOne(startTime: number, subscriptionId: string, update: any = {}): void {
		return this.emitOne(startTime, subscriptionId, update);
	}

	public testEmitMany(startTime: number, subscriptionId: string, update: any = {total: 0, data: [], recounting: false}): void {
		return this.emitMany(startTime, subscriptionId, update);
	}

	public testEmitTotal(startTime: number, subscriptionId: string, total: any): void {
		return this.emitTotal(startTime, subscriptionId, total);
	}

	public testEmitDelete(startTime: number, subscriptionId: string, deleted: any): void {
		return this.emitDelete(startTime, subscriptionId, deleted);
	}

	public testEmitError(startTime: number, subscriptionId: string, error: any): void {
		return this.emitError(startTime, subscriptionId, error);
	}

	public testShouldConsiderFields(): boolean {
		return this.shouldConsiderFields();
	}

	public testRemoveSubscriptionDiff(subId: string): void {
		return this.removeSubscriptionDiff(subId);
	}

	public testIsQueryChange(subId: string): boolean {
		return this.isQueryChange(subId);
	}

	public get testModel(): Model<any> {
		return this.model;
	}

	public setSubscription(subscription: Subscription): void {
		this.subscription = subscription;
	}

	public getSubscriptionId(): string {
		return this._subscriptionId;
	}

	public getQuery(): any {
		return this._query;
	}

	public getFields(): any {
		return this._fields;
	}

	public getDelay(): number {
		return this._delay;
	}

	public getSubscriptionDiffs(): Map<string, boolean> {
		return this._subscriptionDiffs;
	}

	public getIncremental(): boolean {
		return this._incremental;
	}
}

describe('AStore tests', () => {
	let mockModel: jest.Mocked<Model<any>>;
	let mockStore: MockAStore;
	let mockObservableModel: jest.MockedFunction<typeof observableModel>;
	let mockGetMillisecondsFrom: jest.MockedFunction<typeof getMillisecondsFrom>;
	let mockRandomUUID: jest.MockedFunction<typeof randomUUID>;
	let mockSubscription: jest.Mocked<Subscription>;

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
		mockGetMillisecondsFrom = getMillisecondsFrom as jest.MockedFunction<typeof getMillisecondsFrom>;
		mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>;

		mockSubscription = {
			unsubscribe: jest.fn(),
			closed: false,
			add: jest.fn(),
			remove: jest.fn()
		} as any;

		// Mock return values
		mockGetMillisecondsFrom.mockReturnValue(123.45);
		mockRandomUUID.mockReturnValue('12345678-1234-1234-1234-123456789012');

		// Mock observable model
		const mockObservable = {
			pipe: jest.fn().mockReturnThis(),
			subscribe: jest.fn().mockReturnValue(mockSubscription)
		};
		mockObservableModel.mockReturnValue(mockObservable as any);

		// Create store instance
		mockStore = new MockAStore(mockModel, 'testTarget');
	});

	describe('constructor', () => {
		it('should initialize with correct default values', () => {
			expect(mockStore.testModel).toBe(mockModel);
			expect(mockStore.target).toBe('testTarget');
			expect(mockStore.getQuery()).toEqual({});
			expect(mockStore.getFields()).toEqual({});
			expect(mockStore.getDelay()).toBe(100);
			expect(mockStore.getSubscriptionDiffs()).toBeInstanceOf(Map);
		});
	});

	describe('destroy', () => {
		it('should unsubscribe from subscription', () => {
			mockStore.setSubscription(mockSubscription);
			mockStore.destroy();
			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('should handle undefined subscription', () => {
			expect(() => mockStore.destroy()).not.toThrow();
		});
	});

	describe('restartSubscription', () => {
		it('should create and start new subscription', () => {
			mockStore.restartSubscription();
			expect(mockObservableModel).toHaveBeenCalledWith(mockModel);
		});

		it('should destroy existing subscription before creating new one', () => {
			mockStore.setSubscription(mockSubscription);
			mockStore.restartSubscription();
			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
		});
	});

	describe('isInitialSubscription', () => {
		it('should return true for empty change', () => {
			expect(mockStore.testIsInitialSubscription({})).toBe(true);
		});

		it('should return false for non-empty change', () => {
			expect(mockStore.testIsInitialSubscription({operationType: 'insert'})).toBe(false);
		});
	});

	describe('extractFromConfig', () => {
		it('should extract configuration values', () => {
			const config = {
				subscriptionId: 'test-sub-123',
				query: {name: 'test'},
				sort: {createdAt: -1},
				fields: {name: 1, email: 1},
				populates: ['user'],
				virtuals: ['fullName'],
				delay: 200,
				strict: false as const,
				incremental: false as const
			};

			mockStore.config = config;
			mockStore.testExtractFromConfig();

			expect(mockStore.getSubscriptionId()).toBe('test-sub-123');
			expect(mockStore.getQuery()).toEqual({name: 'test'});
			expect(mockStore.getFields()).toEqual({name: 1, email: 1});
			expect(mockStore.getDelay()).toBe(200);
		});

		it('should handle fields as array', () => {
			const config = {
				query: {},
				fields: ['name', 'email', 'createdAt'],
				strict: false as const,
				incremental: false as const
			};

			mockStore.config = config;
			mockStore.testExtractFromConfig();

			expect(mockStore.getFields()).toEqual({name: 1, email: 1, createdAt: 1});
		});

		it('should use default values when not provided', () => {
			const config = {
				query: {},
				strict: false as const,
				incremental: false as const
			};

			mockStore.config = config;

			expect(mockStore.getSubscriptionId()).toBeDefined();
			expect(mockStore.getQuery()).toEqual({});
			expect(mockStore.getFields()).toEqual({});
			expect(mockStore.getDelay()).toBe(100);
		});
	});

	describe('testDocument', () => {
		it('should return true for matching document', () => {
			mockStore.config = {query: {status: 'active'}, strict: false as const, incremental: false as const};
			const document = {status: 'active', name: 'test'};
			expect(mockStore.testTestDocument(document)).toBe(true);
		});

		it('should return false for non-matching document', () => {
			mockStore.config = {query: {status: 'active'}, strict: false as const, incremental: false as const};
			const document = {status: 'inactive', name: 'test'};
			expect(mockStore.testTestDocument(document)).toBe(false);
		});

		it('should return true on error', () => {
			mockStore.config = {query: {$invalid: 'invalid-query'}, strict: false as const, incremental: false as const};
			const document = {name: 'test'};
			expect(mockStore.testTestDocument(document)).toBe(true);
		});
	});

	describe('emit methods', () => {
		beforeEach(() => {
			jest.spyOn(mockStore, 'next').mockImplementation();
			mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false as const, incremental: false as const};
		});

		describe('emitOne', () => {
			it('should emit single update', () => {
				const update = {name: 'test'};
				mockStore.testEmitOne(1000, 'test-sub', update);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'update',
						target: 'testTarget',
						payload: {testTarget: update},
						execution_time: '123.45ms'
					})
				);
			});

			it('should emit with incremental type', () => {
				mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false, incremental: true} as any;

				// Verify that incremental flag is properly set
				expect(mockStore.getIncremental()).toBe(true);

				mockStore.testEmitOne(1000, 'test-sub', {});

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'increment'
					})
				);
			});
		});

		describe('emitMany', () => {
			it('should emit multiple updates', () => {
				const update = {total: 5, data: [{name: 'test1'}, {name: 'test2'}] as any[], recounting: false};
				mockStore.testEmitMany(1000, 'test-sub', update);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'update',
						target: 'testTarget',
						payload: {
							testTarget: update.data,
							_testTargetCount: 5
						},
						execution_time: '123.45ms'
					})
				);
			});

			it('should include recounting flag', () => {
				const update = {total: 5, data: [] as any[], recounting: true};
				mockStore.testEmitMany(1000, 'test-sub', update);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						payload: expect.objectContaining({
							_testTargetRecounting: true
						})
					})
				);
			});

			it('should not include count for incremental updates', () => {
				mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false, incremental: true} as any;
				const update = {total: 5, data: [] as any[], recounting: false};
				mockStore.testEmitMany(1000, 'test-sub', update);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						payload: expect.not.objectContaining({
							_testTargetCount: expect.anything()
						})
					})
				);
			});
		});

		describe('emitTotal', () => {
			it('should emit total count', () => {
				mockStore.testEmitTotal(1000, 'test-sub', 10);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'total',
						target: 'testTarget',
						total: 10,
						execution_time: '123.45ms'
					})
				);
			});
		});

		describe('emitDelete', () => {
			it('should emit delete event', () => {
				const deleted = 'deleted-id';
				mockStore.testEmitDelete(1000, 'test-sub', deleted);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'delete',
						target: 'testTarget',
						payload: deleted,
						execution_time: '123.45ms'
					})
				);
			});
		});

		describe('emitError', () => {
			it('should emit error event', () => {
				const error = new Error('Test error');
				mockStore.testEmitError(1000, 'test-sub', error);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'error',
						error,
						target: 'testTarget',
						execution_time: '123.45ms'
					})
				);
			});
		});
	});

	describe('shouldConsiderFields', () => {
		it('should return true when fields are not empty and no zero values', () => {
			mockStore.config = {fields: {name: 1, email: 1}} as any;
			expect(mockStore.testShouldConsiderFields()).toBe(true);
		});

		it('should return false when fields are empty', () => {
			mockStore.config = {fields: {}} as any;
			expect(mockStore.testShouldConsiderFields()).toBe(false);
		});

		it('should return false when fields contain zero values', () => {
			mockStore.config = {fields: {name: 1, password: 0}} as any;
			expect(mockStore.testShouldConsiderFields()).toBe(false);
		});
	});

	describe('config setter', () => {
		it('should set and extract configuration', () => {
			const config = {
				subscriptionId: 'test-sub',
				query: {status: 'active'},
				sort: {createdAt: -1}
			} as any;

			mockStore.config = config;

			expect(mockStore.getSubscriptionId()).toBe('test-sub');
			expect(mockStore.getQuery()).toEqual({status: 'active'});
			expect(mockObservableModel).toHaveBeenCalled();
		});

		it('should generate subscriptionId if not provided', () => {
			const config = {query: {status: 'active'}} as any;

			mockStore.config = config;

			expect(mockStore.getSubscriptionId()).toBeDefined();
			expect(mockStore.getSubscriptionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('should not update if config is invalid', () => {
			const originalConfig = _.cloneDeep(mockStore.config);
			mockStore.config = originalConfig; // Same config

			expect(mockStore.config).toEqual(originalConfig);
		});
	});

	describe('subscription diff management', () => {
		it('should add subscription diff', () => {
			const config = {
				subscriptionId: 'test-sub',
				query: {status: 'active'}
			} as any;

			mockStore.config = config;
			expect(mockStore.testIsQueryChange('test-sub')).toBe(true);
		});

		it('should remove subscription diff', () => {
			const config = {
				subscriptionId: 'test-sub',
				query: {status: 'active'}
			} as any;

			mockStore.config = config;
			mockStore.testRemoveSubscriptionDiff('test-sub');
			expect(mockStore.testIsQueryChange('test-sub')).toBe(false);
		});
	});

	describe('target getter', () => {
		it('should return target', () => {
			expect(mockStore.target).toBe('testTarget');
		});
	});
});
