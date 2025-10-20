'use strict';

import OwservableClient from '../src/owservable.client';
import IConnectionManager from '../src/auth/i.connection.manager';
import storeFactory from '../src/store/factories/store.factory';
import DataMiddlewareMap from '../src/middleware/data.middleware.map';
import EStoreType from '../src/enums/store.type.enum';

// Mock dependencies
jest.mock('../src/store/factories/store.factory');
jest.mock('../src/middleware/data.middleware.map');

describe('OwservableClient tests', () => {
	let mockConnectionManager: jest.Mocked<IConnectionManager>;
	let client: OwservableClient;
	let mockStore: any;
	let mockSubscription: any;
	let mockStoreFactory: jest.MockedFunction<typeof storeFactory>;
	let originalSetTimeout: typeof setTimeout;
	let originalClearTimeout: typeof clearTimeout;

	beforeEach(() => {
		// Save original timeout functions
		originalSetTimeout = (global as any).setTimeout;
		originalClearTimeout = (global as any).clearTimeout;

		// Mock setTimeout and clearTimeout
		(global as any).setTimeout = jest.fn((callback, delay) => {
			// Execute callback immediately for testing
			if (delay === 60000) {
				// Don't auto-execute ping timeout to avoid infinite recursion
				return 'ping-timeout' as any;
			}
			// Execute other timeouts immediately
			callback();
			return 'timeout-id' as any;
		});
		(global as any).clearTimeout = jest.fn();

		// Mock connection manager
		mockConnectionManager = {
			connected: jest.fn(),
			disconnected: jest.fn(),
			location: jest.fn(),
			ping: jest.fn(),
			checkSession: jest.fn(),
			user: {id: 'test-user'}
		} as any;

		// Mock store and subscription
		mockSubscription = {
			unsubscribe: jest.fn()
		};

		mockStore = {
			config: null,
			subscribe: jest.fn().mockReturnValue(mockSubscription),
			destroy: jest.fn(),
			restartSubscription: jest.fn()
		};

		// Mock store factory
		mockStoreFactory = storeFactory as jest.MockedFunction<typeof storeFactory>;
		mockStoreFactory.mockReturnValue(mockStore);

		// Mock DataMiddlewareMap
		(DataMiddlewareMap.getMiddleware as jest.Mock) = jest.fn();

		// Create client instance
		client = new OwservableClient(mockConnectionManager);

		// Mock client.next to avoid actual subject emissions
		jest.spyOn(client, 'next').mockImplementation();
		jest.spyOn(client, 'error').mockImplementation();
		jest.spyOn(client, 'complete').mockImplementation();
	});

	afterEach(() => {
		// Restore original timeout functions
		(global as any).setTimeout = originalSetTimeout;
		(global as any).clearTimeout = originalClearTimeout;
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with connection manager', () => {
			expect(client).toBeInstanceOf(OwservableClient);
			expect((client as any)._connectionManager).toBe(mockConnectionManager);
			expect((client as any)._stores).toBeInstanceOf(Map);
			expect((client as any)._subscriptions).toBeInstanceOf(Map);
		});
	});

	describe('disconnected', () => {
		it('should clear subscriptions and notify connection manager', () => {
			const mockClearSubscriptions = jest.spyOn(client as any, 'clearSubscriptions').mockImplementation();

			client.disconnected();

			expect(mockClearSubscriptions).toHaveBeenCalled();
			expect(mockConnectionManager.disconnected).toHaveBeenCalled();
			expect((global as any).clearTimeout).toHaveBeenCalled();
		});
	});

	describe('ping', () => {
		it('should send ping message and schedule next ping', () => {
			const originalDate = Date;
			const mockDate = jest.fn(() => ({getTime: () => 12345}));
			global.Date = mockDate as any;

			client.ping();

			expect(client.next).toHaveBeenCalledWith({
				type: 'ping',
				id: 12345
			});
			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);

			global.Date = originalDate;
		});
	});

	describe('consume', () => {
		beforeEach(() => {
			jest.spyOn(client as any, '_processPong').mockImplementation();
			jest.spyOn(client as any, '_checkSession').mockImplementation();
			jest.spyOn(client as any, 'updateSubscription').mockImplementation();
			jest.spyOn(client as any, 'removeSubscription').mockImplementation();
			jest.spyOn(client as any, 'reloadData').mockImplementation();
		});

		it('should handle pong message', async () => {
			const message = {type: 'pong'};

			await client.consume(message);

			expect((client as any)._processPong).toHaveBeenCalledWith(message);
		});

		it('should handle authenticate message', async () => {
			const message = {type: 'authenticate', jwt: 'test-token'};

			await client.consume(message);

			expect(mockConnectionManager.connected).toHaveBeenCalledWith('test-token');
			expect((client as any)._checkSession).toHaveBeenCalled();
		});

		it('should handle location message', async () => {
			const message = {type: 'location', path: '/new/path'};

			await client.consume(message);

			expect(mockConnectionManager.location).toHaveBeenCalledWith('/new/path');
		});

		it('should handle subscribe message', async () => {
			const message = {type: 'subscribe', target: 'test-target'};

			await client.consume(message);

			expect((client as any).updateSubscription).toHaveBeenCalledWith(message);
		});

		it('should handle unsubscribe message', async () => {
			const message = {type: 'unsubscribe', target: 'test-target'};

			await client.consume(message);

			expect((client as any).removeSubscription).toHaveBeenCalledWith('test-target');
		});

		it('should handle reload message', async () => {
			const message = {type: 'reload', target: 'test-target'};

			await client.consume(message);

			expect((client as any).reloadData).toHaveBeenCalledWith('test-target');
		});

		it('should handle unknown message type gracefully', async () => {
			const message = {type: 'unknown'};

			await expect(client.consume(message)).resolves.toBeUndefined();
		});
	});

	describe('_processPong', () => {
		it('should calculate and update ping time', () => {
			const originalDate = Date;
			const mockDate = jest.fn(() => ({getTime: () => 67890}));
			global.Date = mockDate as any;

			const message = {id: 12345};

			(client as any)._processPong(message);

			expect(mockConnectionManager.ping).toHaveBeenCalledWith(67890 - 12345);
			expect((client as any)._ping).toBe(67890 - 12345);

			global.Date = originalDate;
		});
	});

	describe('_checkSession', () => {
		it('should check session and schedule refresh', async () => {
			const checkResult = {refresh_in: 300000};
			mockConnectionManager.checkSession.mockResolvedValue(checkResult as any);

			await (client as any)._checkSession();

			expect(mockConnectionManager.checkSession).toHaveBeenCalled();
			expect(client.next).toHaveBeenCalledWith(checkResult);
			expect((global as any).clearTimeout).toHaveBeenCalled();
			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000); // 95% of 300000
		});

		it('should handle no refresh_in with default value', async () => {
			mockConnectionManager.checkSession.mockResolvedValue({} as any);

			await (client as any)._checkSession();

			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000); // 95% of default 300000
		});

		it('should handle null checkSession result without calling next', async () => {
			mockConnectionManager.checkSession.mockResolvedValue(null);

			await (client as any)._checkSession();

			expect(mockConnectionManager.checkSession).toHaveBeenCalled();
			expect(client.next).not.toHaveBeenCalled();
			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000);
		});

		it('should handle undefined checkSession result without calling next', async () => {
			mockConnectionManager.checkSession.mockResolvedValue(undefined);

			await (client as any)._checkSession();

			expect(mockConnectionManager.checkSession).toHaveBeenCalled();
			expect(client.next).not.toHaveBeenCalled();
			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000);
		});
	});

	describe('removeSubscription', () => {
		it('should remove subscription and store', () => {
			const target = 'test-target';
			const mockSendDebugTargets = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			// Set up subscription and store
			(client as any)._subscriptions.set(target, mockSubscription);
			(client as any)._stores.set(target, mockStore);

			(client as any).removeSubscription(target);

			expect(mockSubscription.unsubscribe).toHaveBeenCalled();
			expect(mockStore.destroy).toHaveBeenCalled();
			expect((client as any)._subscriptions.has(target)).toBe(false);
			expect((client as any)._stores.has(target)).toBe(false);
			expect(mockSendDebugTargets).toHaveBeenCalledWith('removeSubscription', target);
		});

		it('should handle missing subscription gracefully', () => {
			const target = 'missing-target';
			const mockSendDebugTargets = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			(client as any).removeSubscription(target);

			expect(mockSendDebugTargets).toHaveBeenCalledWith('removeSubscription', target);
		});
	});

	describe('reloadData', () => {
		it('should restart subscription for target store', () => {
			const target = 'test-target';
			(client as any)._stores.set(target, mockStore);

			(client as any).reloadData(target);

			expect(mockStore.restartSubscription).toHaveBeenCalled();
		});
	});

	describe('updateSubscription', () => {
		it('should update existing store config', () => {
			const target = 'test-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			(client as any)._stores.set(target, mockStore);

			(client as any).updateSubscription(subscriptionConfig);

			expect(mockStore.config).toBe(config);
		});

		it("should create a new subscription when store doesn't exist", () => {
			const target = 'new-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			(DataMiddlewareMap.getMiddleware as jest.Mock).mockReturnValue(null);

			(client as any).updateSubscription(subscriptionConfig);

			expect(mockStoreFactory).toHaveBeenCalledWith(EStoreType.COLLECTION, 'testModel', target);
			expect((client as any)._stores.get(target)).toBe(mockStore);
			expect((client as any)._subscriptions.get(target)).toBe(mockSubscription);
			expect(mockStore.config).toBe(config);
		});

		it('should handle store subscription with middleware', async () => {
			const target = 'middleware-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			const mockMiddleware = jest.fn().mockResolvedValue({processed: true});
			(DataMiddlewareMap.getMiddleware as jest.Mock).mockReturnValue(mockMiddleware);

			(client as any).updateSubscription(subscriptionConfig);

			// Get the subscription callback and test it
			const subscribeCall = mockStore.subscribe.mock.calls[0][0];
			const testMessage = {data: 'test'};

			await subscribeCall.next(testMessage);

			expect(mockMiddleware).toHaveBeenCalledWith(testMessage, mockConnectionManager.user);
			expect(client.next).toHaveBeenCalledWith({processed: true});
		});

		it('should handle store subscription without middleware', async () => {
			const target = 'no-middleware-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			(DataMiddlewareMap.getMiddleware as jest.Mock).mockReturnValue(null);

			(client as any).updateSubscription(subscriptionConfig);

			// Get the subscription callback and test it
			const subscribeCall = mockStore.subscribe.mock.calls[0][0];
			const testMessage = {data: 'test'};

			await subscribeCall.next(testMessage);

			expect(client.next).toHaveBeenCalledWith(testMessage);
		});

		it('should handle invalid target in subscription', async () => {
			const target = 'invalid-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			jest.spyOn(client as any, 'isValidTarget').mockReturnValue(false);

			(client as any).updateSubscription(subscriptionConfig);

			// Get the subscription callback and test it
			const subscribeCall = mockStore.subscribe.mock.calls[0][0];
			const testMessage = {data: 'test'};

			await subscribeCall.next(testMessage);

			// Should not call next when target is invalid
			expect(client.next).not.toHaveBeenCalledWith(testMessage);
		});

		it('should handle subscription error', () => {
			const target = 'error-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			(client as any).updateSubscription(subscriptionConfig);

			// Get the subscription callback and test error handling
			const subscribeCall = mockStore.subscribe.mock.calls[0][0];
			const testError = new Error('Test error');

			subscribeCall.error(testError);

			expect(client.error).toHaveBeenCalledWith(testError);
		});

		it('should handle subscription complete', () => {
			const target = 'complete-target';
			const config = {query: {status: 'active'}};
			const subscriptionConfig = {
				target,
				scope: EStoreType.COLLECTION,
				observe: 'testModel',
				config
			};

			(client as any).updateSubscription(subscriptionConfig);

			// Get the subscription callback and test complete handling
			const subscribeCall = mockStore.subscribe.mock.calls[0][0];

			subscribeCall.complete();

			expect(client.complete).toHaveBeenCalled();
		});
	});

	describe('isValidTarget', () => {
		it('should return true for valid target', () => {
			const target = 'valid-target';
			(client as any)._stores.set(target, mockStore);

			const result = (client as any).isValidTarget(target);

			expect(result).toBe(true);
		});

		it('should return false for invalid target', () => {
			const result = (client as any).isValidTarget('invalid-target');

			expect(result).toBe(false);
		});

		it('should return false when stores is null', () => {
			(client as any)._stores = null;

			const result = (client as any).isValidTarget('any-target');

			expect(result).toBe(false);
		});
	});

	describe('sendDebugTargets', () => {
		it('should send debug message with available targets', () => {
			const originalDate = Date;
			const mockDate = jest.fn(() => ({getTime: () => 98765}));
			global.Date = mockDate as any;

			const event = 'test-event';
			const target = 'test-target';
			(client as any)._stores.set('target1', mockStore);
			(client as any)._stores.set('target2', mockStore);

			(client as any).sendDebugTargets(event, target);

			expect(client.next).toHaveBeenCalledWith({
				type: 'debug',
				id: 98765,
				payload: {
					event: 'test-event',
					target: 'test-target',
					availableTargets: 'target1, target2'
				}
			});

			global.Date = originalDate;
		});

		it('should return false when stores is null', () => {
			(client as any)._stores = null;

			const result = (client as any).sendDebugTargets('event', 'target');

			expect(result).toBe(false);
		});
	});

	describe('clearSubscriptions', () => {
		it('should clear all subscriptions and stores', () => {
			const mockSendDebugTargets = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			// Set up subscriptions and stores
			(client as any)._subscriptions.set('sub1', mockSubscription);
			(client as any)._subscriptions.set('sub2', {unsubscribe: jest.fn()});
			(client as any)._stores.set('store1', mockStore);
			(client as any)._stores.set('store2', {destroy: jest.fn()});

			(client as any).clearSubscriptions();

			expect(mockSubscription.unsubscribe).toHaveBeenCalled();
			expect(mockStore.destroy).toHaveBeenCalled();
			expect((client as any)._subscriptions).toBeNull();
			expect((client as any)._stores).toBeNull();
			expect(mockSendDebugTargets).toHaveBeenCalledWith('clearSubscriptions', '*');
		});

		it('should handle null subscriptions and stores gracefully', () => {
			(client as any)._subscriptions = null;
			(client as any)._stores = null;

			const mockSendDebugTargets = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			expect(() => (client as any).clearSubscriptions()).not.toThrow();
			expect(mockSendDebugTargets).toHaveBeenCalledWith('clearSubscriptions', '*');
		});
	});

	describe('location setter', () => {
		it('should update location and notify connection manager', () => {
			const newLocation = '/new/location';

			(client as any).location = newLocation;

			expect((client as any)._location).toBe(newLocation);
			expect(mockConnectionManager.location).toHaveBeenCalledWith(newLocation);
		});

		it('should not update if location is the same', () => {
			const location = '/same/location';
			(client as any)._location = location;

			(client as any).location = location;

			expect(mockConnectionManager.location).not.toHaveBeenCalled();
		});
	});
});
