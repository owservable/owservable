'use strict';

import observableDatabase from '../../../src/mongodb/functions/observable.database.factory';
import ObservableDatabase from '../../../src/mongodb/functions/observable.database';

jest.mock('../../../src/mongodb/functions/observable.database');

describe('observable.database.factory tests', () => {
	let mockObservableDatabaseInstance: any;
	let mockInitSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		mockObservableDatabaseInstance = {
			subscribe: jest.fn(),
			lifecycle: {subscribe: jest.fn()}
		};

		mockInitSpy = jest.spyOn(ObservableDatabase, 'init');
		mockInitSpy.mockReturnValue(mockObservableDatabaseInstance);
	});

	afterEach(() => {
		mockInitSpy.mockRestore();
	});

	it('should be a function', () => {
		expect(typeof observableDatabase).toBe('function');
	});

	it('should return an ObservableDatabase instance', () => {
		const result: ObservableDatabase = observableDatabase();
		expect(result).toBeDefined();
		expect(result.subscribe).toBeDefined();
		expect(result.lifecycle).toBeDefined();
	});

	it('should delegate to ObservableDatabase.init', () => {
		observableDatabase();
		expect(ObservableDatabase.init).toHaveBeenCalledTimes(1);
		expect(ObservableDatabase.init).toHaveBeenCalledWith();
	});

	it('should return the result from ObservableDatabase.init', () => {
		const result: ObservableDatabase = observableDatabase();
		expect(result).toBe(mockObservableDatabaseInstance);
	});

	it('should return the same instance on multiple calls (singleton)', () => {
		const result1: ObservableDatabase = observableDatabase();
		const result2: ObservableDatabase = observableDatabase();

		expect(result1).toBe(result2);
		expect(result1).toBe(mockObservableDatabaseInstance);
		expect(result2).toBe(mockObservableDatabaseInstance);
	});

	it('should call ObservableDatabase.init each time it is invoked', () => {
		observableDatabase();
		observableDatabase();
		observableDatabase();

		expect(ObservableDatabase.init).toHaveBeenCalledTimes(3);
	});
});
