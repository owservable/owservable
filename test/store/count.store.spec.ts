'use strict';

import CountStore from '../../src/store/count.store';
import EStoreType from '../../src/_enums/store.type.enum';

describe('CountStore tests', () => {
	let mockModel: any;
	let mockStore: CountStore;

	beforeEach(() => {
		// Mock dependencies
		mockModel = {
			countDocuments: jest.fn(),
		} as any;

		mockStore = new CountStore(mockModel, 'test-target');
		
		// Mock inherited methods
		jest.spyOn(mockStore as any, 'emitOne').mockImplementation();
		jest.spyOn(mockStore as any, 'isInitialSubscription').mockReturnValue(false);
		
		// Set up basic properties
		(mockStore as any)._subscriptionId = 'test-sub-id';
		(mockStore as any)._query = {status: 'active'};
		(mockStore as any)._config = {query: {status: 'active'}};
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with correct store type', () => {
			expect((mockStore as any)._type).toBe(EStoreType.COUNT);
		});

		it('should set correct prototype', () => {
			expect(Object.getPrototypeOf(mockStore)).toBe(CountStore.prototype);
		});

		it('should call parent constructor', () => {
			expect((mockStore as any)._model).toBe(mockModel);
			expect((mockStore as any)._target).toBe('test-target');
		});
	});

	describe('shouldReload', () => {
		it('should return true for initial subscription', () => {
			jest.spyOn(mockStore as any, 'isInitialSubscription').mockReturnValue(true);
			
			const result = (mockStore as any).shouldReload({});
			
			expect(result).toBe(true);
		});

		it('should return true for delete operation', () => {
			const change = {operationType: 'delete'};
			
			const result = (mockStore as any).shouldReload(change);
			
			expect(result).toBe(true);
		});

		it('should return true for insert operation', () => {
			const change = {operationType: 'insert'};
			
			const result = (mockStore as any).shouldReload(change);
			
			expect(result).toBe(true);
		});

		it('should return false for replace operation', () => {
			const change = {operationType: 'replace'};
			
			const result = (mockStore as any).shouldReload(change);
			
			expect(result).toBe(false);
		});

		it('should return false for update operation', () => {
			const change = {operationType: 'update'};
			
			const result = (mockStore as any).shouldReload(change);
			
			expect(result).toBe(false);
		});

		it('should return false for unknown operation', () => {
			const change = {operationType: 'unknown'};
			
			const result = (mockStore as any).shouldReload(change);
			
			expect(result).toBe(false);
		});

		it('should return false for no operation type', () => {
			const change = {};
			
			const result = (mockStore as any).shouldReload(change);
			
			expect(result).toBe(false);
		});
	});

	describe('load', () => {
		it('should emit one with subscription ID when config is empty', async () => {
			(mockStore as any)._config = {};
			
			await (mockStore as any).load({});
			
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id');
		});

		it('should return early if should not reload', async () => {
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(false);
			
			await (mockStore as any).load({});
			
			expect(mockModel.countDocuments).not.toHaveBeenCalled();
		});

		it('should count documents and emit result', async () => {
			mockModel.countDocuments.mockResolvedValue(42);
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			
			await (mockStore as any).load({});
			
			expect(mockModel.countDocuments).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 42);
		});

		it('should handle count of zero', async () => {
			mockModel.countDocuments.mockResolvedValue(0);
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			
			await (mockStore as any).load({});
			
			expect(mockModel.countDocuments).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 0);
		});

		it('should handle large count numbers', async () => {
			mockModel.countDocuments.mockResolvedValue(999999);
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			
			await (mockStore as any).load({});
			
			expect(mockModel.countDocuments).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 999999);
		});

		it('should handle different query types', async () => {
			(mockStore as any)._query = {userId: 'test-user', active: true};
			mockModel.countDocuments.mockResolvedValue(5);
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			
			await (mockStore as any).load({});
			
			expect(mockModel.countDocuments).toHaveBeenCalledWith({userId: 'test-user', active: true});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 5);
		});

		it('should handle insert operation change', async () => {
			const change = {operationType: 'insert', fullDocument: {_id: 'new-doc'}};
			mockModel.countDocuments.mockResolvedValue(10);
			
			await (mockStore as any).load(change);
			
			expect(mockModel.countDocuments).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 10);
		});

		it('should handle delete operation change', async () => {
			const change = {operationType: 'delete', documentKey: {_id: 'deleted-doc'}};
			mockModel.countDocuments.mockResolvedValue(8);
			
			await (mockStore as any).load(change);
			
			expect(mockModel.countDocuments).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 8);
		});
	});
});
