'use strict';
import MongoDBConnector from '../../src/mongodb/mongodb.connector';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => {
	const mockConnection = {
		on: jest.fn(),
		readyState: 1 // Connected state
	};

	const mockConnect = jest.fn().mockResolvedValue(undefined);

	return {
		connect: mockConnect,
		connection: mockConnection,
		default: {
			connect: mockConnect,
			connection: mockConnection
		}
	};
});

describe('MongoDBConnector tests', () => {
	let mockConnection: any;
	let mockConnect: jest.Mock;
	let consoleLogSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		// Reset static _connection property
		(MongoDBConnector as any)._connection = null;

		// Get mock connection and connect function
		mockConnection = mongoose.connection;
		mockConnect = mongoose.connect as jest.Mock;

		// Reset all mocks
		jest.clearAllMocks();

		// Spy on console methods
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
	});

	afterEach(() => {
		// Restore console methods
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe('constructor', () => {
		it('should be a static utility class', () => {
			// MongoDBConnector should be used as a static utility class
			expect(typeof MongoDBConnector).toBe('function');
			expect(MongoDBConnector.init).toBeDefined();
			expect(MongoDBConnector.connection).toBeDefined();
		});
	});

	describe('init', () => {
		it('should initialize MongoDB connection successfully', async () => {
			const mongoDbUri = 'mongodb://localhost:27017/test';
			mockConnect.mockResolvedValue(undefined);

			const result = await MongoDBConnector.init(mongoDbUri);

			expect(mockConnect).toHaveBeenCalledWith(mongoDbUri, {
				minPoolSize: 20,
				maxPoolSize: 100
			});
			expect(result).toBe(mockConnection);
			expect((MongoDBConnector as any)._connection).toBe(mockConnection);
		});

		it('should return existing connection if already initialized', async () => {
			const mongoDbUri = 'mongodb://localhost:27017/test';
			mockConnect.mockResolvedValue(undefined);

			// First initialization
			const result1 = await MongoDBConnector.init(mongoDbUri);
			expect(mockConnect).toHaveBeenCalledTimes(1);

			// Second initialization should return existing connection
			const result2 = await MongoDBConnector.init(mongoDbUri);
			expect(mockConnect).toHaveBeenCalledTimes(1); // Should not be called again
			expect(result1).toBe(result2);
			expect(result2).toBe(mockConnection);
		});

		it('should handle connection errors', async () => {
			const mongoDbUri = 'mongodb://localhost:27017/test';
			const connectionError = new Error('Connection failed');
			mockConnect.mockRejectedValue(connectionError);

			await expect(MongoDBConnector.init(mongoDbUri)).rejects.toThrow('Connection failed');
			expect(mockConnect).toHaveBeenCalledWith(mongoDbUri, {
				minPoolSize: 20,
				maxPoolSize: 100
			});
		});
	});

	describe('connection', () => {
		it('should return the current connection', () => {
			const testConnection = {test: 'connection'};
			(MongoDBConnector as any)._connection = testConnection;

			const result = MongoDBConnector.connection;

			expect(result).toBe(testConnection);
		});

		it('should return null if no connection exists', () => {
			(MongoDBConnector as any)._connection = null;

			const result = MongoDBConnector.connection;

			expect(result).toBeNull();
		});
	});

	describe('event handlers', () => {
		it('should register and trigger connection event handlers', async () => {
			const mongoDbUri = 'mongodb://localhost:27017/test';
			mockConnect.mockResolvedValue(undefined);

			// Initialize connection to register event handlers
			await MongoDBConnector.init(mongoDbUri);

			// Verify event handlers were registered
			expect(mockConnection.on).toHaveBeenCalledWith('connecting', expect.any(Function));
			expect(mockConnection.on).toHaveBeenCalledWith('connected', expect.any(Function));
			expect(mockConnection.on).toHaveBeenCalledWith('open', expect.any(Function));
			expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
			expect(mockConnection.on).toHaveBeenCalledWith('disconnecting', expect.any(Function));
			expect(mockConnection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
			expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));

			// Trigger each event handler to increase function coverage
			const onCalls = mockConnection.on.mock.calls;

			// Find and trigger each event handler
			const connectingHandler = onCalls.find((call: any) => call[0] === 'connecting')[1];
			const connectedHandler = onCalls.find((call: any) => call[0] === 'connected')[1];
			const openHandler = onCalls.find((call: any) => call[0] === 'open')[1];
			const errorHandler = onCalls.find((call: any) => call[0] === 'error')[1];
			const disconnectingHandler = onCalls.find((call: any) => call[0] === 'disconnecting')[1];
			const disconnectedHandler = onCalls.find((call: any) => call[0] === 'disconnected')[1];
			const closeHandler = onCalls.find((call: any) => call[0] === 'close')[1];

			// Execute event handlers to cover the arrow functions
			connectingHandler();
			connectedHandler();
			openHandler();
			errorHandler(new Error('Test error'));
			disconnectingHandler();
			disconnectedHandler();
			closeHandler();

			// Verify console methods were called
			expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB connecting to', mongoDbUri, '...');
			expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB connected to', mongoDbUri);
			expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB opened connection to', mongoDbUri);
			expect(consoleErrorSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB connection error:', new Error('Test error'));
			expect(consoleErrorSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB disconnecting from', mongoDbUri, '...');
			expect(consoleErrorSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB disconnected from', mongoDbUri);
			expect(consoleErrorSpy).toHaveBeenCalledWith('[@owservable] -> MongoDB closed connection to', mongoDbUri);
		});
	});
});
