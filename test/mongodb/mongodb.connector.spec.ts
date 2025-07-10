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
});
