'use strict';

type StreamHandler = (payload?: any) => void;

function buildStream(): any {
	const handlers: Record<string, StreamHandler[]> = {};
	const stream: any = {
		on: jest.fn((event: string, fn: StreamHandler) => {
			if (!handlers[event]) handlers[event] = [];
			handlers[event].push(fn);
			return stream;
		}),
		removeAllListeners: jest.fn(),
		emit: (event: string, payload?: any): void => {
			for (const fn of handlers[event] || []) fn(payload);
		}
	};
	return stream;
}

const mockWatch: jest.Mock = jest.fn(() => buildStream());

const mockCollection: jest.Mock = jest.fn().mockReturnValue({
	watch: mockWatch
});

const mockDb: {collection: jest.Mock} = {
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
import ObservableModel from '../../../src/mongodb/functions/observable.model';
import observableModel from '../../../src/mongodb/functions/observable.model.factory';
import ObservableModelsMap from '../../../src/mongodb/functions/observable.models.map';

describe('observable.model.ts tests', () => {
	beforeEach(() => {
		mockWatch.mockReset();
		mockWatch.mockImplementation(() => buildStream());
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

	describe('ObservableModel ChangeStream handlers', () => {
		let consoleErrorSpy: jest.SpyInstance;
		let consoleWarnSpy: jest.SpyInstance;
		let consoleInfoSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
			consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
			consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
			consoleWarnSpy.mockRestore();
			consoleInfoSpy.mockRestore();
		});

		it('forwards change events to subscribers', () => {
			const m: ObservableModel = new ObservableModel('directColl1');
			const stream: any = mockWatch.mock.results[mockWatch.mock.results.length - 1].value;
			const nextSpy: jest.Mock = jest.fn();
			m.subscribe({next: nextSpy});
			const change: any = {
				ns: {db: 'd', coll: 'c'},
				documentKey: {_id: '1'},
				operationType: 'update',
				updateDescription: {},
				fullDocument: {}
			};
			stream.emit('change', change);
			expect(nextSpy).toHaveBeenCalledWith(change);
		});

		it('emits lifecycle error when change handler throws', () => {
			const m: ObservableModel = new ObservableModel('directColl2');
			const stream: any = mockWatch.mock.results[mockWatch.mock.results.length - 1].value;
			const lifeSpy: jest.Mock = jest.fn();
			m.lifecycle.subscribe(lifeSpy);
			const badChange: any = new Proxy(
				{},
				{
					get: (): never => {
						throw new Error('bad change');
					}
				}
			);
			stream.emit('change', badChange);
			expect(lifeSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					collection: 'directColl2'
				})
			);
		});

		it('handles stream error by notifying lifecycle and reconnecting', () => {
			const m: ObservableModel = new ObservableModel('directColl3');
			const stream: any = mockWatch.mock.results[mockWatch.mock.results.length - 1].value;
			const lifeSpy: jest.Mock = jest.fn();
			m.lifecycle.subscribe(lifeSpy);
			const callsBefore: number = mockWatch.mock.calls.length;
			stream.emit('error', new Error('stream'));
			expect(mockWatch.mock.calls.length).toBeGreaterThan(callsBefore);
			expect(lifeSpy).toHaveBeenCalledWith(expect.objectContaining({type: 'error'}));
			expect(m).toBeDefined();
		});

		it('handles stream close by notifying lifecycle and reconnecting', () => {
			const m: ObservableModel = new ObservableModel('directColl4');
			const stream: any = mockWatch.mock.results[mockWatch.mock.results.length - 1].value;
			const lifeSpy: jest.Mock = jest.fn();
			m.lifecycle.subscribe(lifeSpy);
			stream.emit('close');
			expect(lifeSpy).toHaveBeenCalledWith(expect.objectContaining({type: 'close', collection: 'directColl4'}));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
		});

		it('handles stream end by notifying lifecycle and reconnecting', () => {
			const m: ObservableModel = new ObservableModel('directColl5');
			const stream: any = mockWatch.mock.results[mockWatch.mock.results.length - 1].value;
			const lifeSpy: jest.Mock = jest.fn();
			m.lifecycle.subscribe(lifeSpy);
			stream.emit('end');
			expect(lifeSpy).toHaveBeenCalledWith(expect.objectContaining({type: 'end', collection: 'directColl5'}));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
		});

		it('logs when removeAllListeners throws during reconnect', () => {
			const failingStream: any = buildStream();
			failingStream.removeAllListeners = jest.fn().mockImplementation((): never => {
				throw new Error('cleanup');
			});
			mockWatch.mockReturnValueOnce(failingStream).mockImplementation(() => buildStream());
			const m: ObservableModel = new ObservableModel('directColl6');
			failingStream.emit('error', new Error('e'));
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('cleaning up old stream'),
				expect.any(Error)
			);
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
			expect(m).toBeDefined();
		});

		it('reconnects when _stream was cleared before reconnect runs', () => {
			const m: ObservableModel = new ObservableModel('directColl7');
			const stream: any = mockWatch.mock.results[mockWatch.mock.results.length - 1].value;
			(m as any)._stream = undefined;
			stream.emit('error', new Error('gone'));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
		});
	});
});
