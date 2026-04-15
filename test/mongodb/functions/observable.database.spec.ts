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

const mockDb: {watch: jest.Mock} = {
	watch: mockWatch
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

import ObservableDatabase from '../../../src/mongodb/functions/observable.database';
import observableDatabase from '../../../src/mongodb/functions/observable.database.factory';

describe('observable.database.ts tests', () => {
	beforeEach(() => {
		(ObservableDatabase as any)._instance = undefined;
		mockWatch.mockReset();
		mockWatch.mockImplementation(() => buildStream());
	});

	describe('observableDatabase function', () => {
		it('should exist and be a function', () => {
			expect(observableDatabase).toBeDefined();
			expect(typeof observableDatabase).toBe('function');
		});

		it('should return a Subject instance', () => {
			const result = observableDatabase();
			expect(result).toBeDefined();
			expect(typeof result.next).toBe('function');
			expect(typeof result.subscribe).toBe('function');
		});

		it('should return the same instance (singleton pattern)', () => {
			const instance1 = observableDatabase();
			const instance2 = observableDatabase();
			expect(instance1).toBe(instance2);
		});

		it('should call mongoose connection.db.watch on instantiation', () => {
			mockWatch.mockClear();

			const result = observableDatabase();

			expect(result).toBeDefined();
			expect(typeof result.next).toBe('function');
		});
	});

	describe('ObservableDatabase ChangeStream handlers', () => {
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
			const db = observableDatabase();
			const stream: any = mockWatch.mock.results[0].value;
			const nextSpy: jest.Mock = jest.fn();
			db.subscribe({next: nextSpy});
			const change: any = {
				ns: {db: 'd', coll: 'c'},
				documentKey: {_id: '1'},
				operationType: 'insert',
				updateDescription: {},
				fullDocument: {}
			};
			stream.emit('change', change);
			expect(nextSpy).toHaveBeenCalledWith(change);
		});

		it('emits lifecycle error when change handler throws', () => {
			const db = observableDatabase();
			const stream: any = mockWatch.mock.results[0].value;
			const lifeSpy: jest.Mock = jest.fn();
			db.lifecycle.subscribe(lifeSpy);
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
					collection: '*'
				})
			);
		});

		it('handles stream error by notifying lifecycle and reconnecting', () => {
			const db = observableDatabase();
			const stream: any = mockWatch.mock.results[0].value;
			const lifeSpy: jest.Mock = jest.fn();
			db.lifecycle.subscribe(lifeSpy);
			stream.emit('error', new Error('stream'));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
			expect(lifeSpy).toHaveBeenCalledWith(expect.objectContaining({type: 'error'}));
		});

		it('handles stream close by notifying lifecycle and reconnecting', () => {
			const db = observableDatabase();
			const stream: any = mockWatch.mock.results[0].value;
			const lifeSpy: jest.Mock = jest.fn();
			db.lifecycle.subscribe(lifeSpy);
			stream.emit('close');
			expect(lifeSpy).toHaveBeenCalledWith(expect.objectContaining({type: 'close'}));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
		});

		it('handles stream end by notifying lifecycle and reconnecting', () => {
			const db = observableDatabase();
			const stream: any = mockWatch.mock.results[0].value;
			const lifeSpy: jest.Mock = jest.fn();
			db.lifecycle.subscribe(lifeSpy);
			stream.emit('end');
			expect(lifeSpy).toHaveBeenCalledWith(expect.objectContaining({type: 'end'}));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
		});

		it('logs when removeAllListeners throws during reconnect', () => {
			(ObservableDatabase as any)._instance = undefined;
			const failingStream: any = buildStream();
			failingStream.removeAllListeners = jest.fn().mockImplementation((): never => {
				throw new Error('cleanup');
			});
			mockWatch.mockReturnValueOnce(failingStream).mockImplementation(() => buildStream());
			const db = observableDatabase();
			failingStream.emit('error', new Error('e'));
			expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('cleaning up old stream'), expect.any(Error));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
			expect(db).toBeDefined();
		});

		it('reconnects when _stream was cleared before reconnect runs', () => {
			const db = observableDatabase();
			const stream: any = mockWatch.mock.results[0].value;
			(db as any)._stream = undefined;
			stream.emit('error', new Error('gone'));
			expect(mockWatch.mock.calls.length).toBeGreaterThanOrEqual(2);
		});
	});
});
