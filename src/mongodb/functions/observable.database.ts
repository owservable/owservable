'use strict';

import {Subject} from 'rxjs';
import mongoose from 'mongoose';
import {ChangeStream} from 'mongodb';

import LifecycleEvent from '../../types/lifecycle.event.type';

class ObservableDatabase extends Subject<any> {
	private _stream: ChangeStream;
	private static _instance: ObservableDatabase;
	public readonly lifecycle: Subject<LifecycleEvent>;

	public static init(): ObservableDatabase {
		if (!ObservableDatabase._instance) ObservableDatabase._instance = new ObservableDatabase();
		return ObservableDatabase._instance;
	}

	constructor() {
		super();
		this.lifecycle = new Subject<LifecycleEvent>();

		this._initializeStream();
	}

	private _initializeStream(): void {
		const db: mongoose.mongo.Db = mongoose.connection.db;

		this._stream = db.watch([], {fullDocument: 'updateLookup'});

		this._stream.on('change', (change: any): void => {
			try {
				const {ns, documentKey, operationType, updateDescription, fullDocument} = change;
				this.next({ns, documentKey, operationType, updateDescription, fullDocument});
			} catch (error) {
				console.error('[@owservable] -> ObservableDatabase Error in change event:', error);
				this.lifecycle.next({
					type: 'error',
					collection: '*',
					timestamp: new Date(),
					error
				});
			}
		});

		this._stream.on('error', (error: any): void => {
			console.error('[@owservable] -> ObservableDatabase ChangeStream error event:', error, ', attempting reconnection...');
			this.lifecycle.next({
				type: 'error',
				collection: '*',
				timestamp: new Date(),
				error
			});
			this._reconnect();
		});

		this._stream.on('close', (): void => {
			console.warn('[@owservable] -> ObservableDatabase ChangeStream close event: stream has closed, attempting reconnection...');
			this.lifecycle.next({
				type: 'close',
				collection: '*',
				timestamp: new Date()
			});
			this._reconnect();
		});

		this._stream.on('end', (): void => {
			console.warn('[@owservable] -> ObservableDatabase ChangeStream end event: stream has ended, attempting reconnection...');
			this.lifecycle.next({
				type: 'end',
				collection: '*',
				timestamp: new Date()
			});
			this._reconnect();
		});

		this.lifecycle.next({
			type: 'live',
			collection: '*',
			timestamp: new Date()
		});
	}

	private _reconnect(): void {
		console.info('[@owservable] -> ObservableDatabase Reconnecting ChangeStream...');
		try {
			if (this._stream) {
				this._stream.removeAllListeners();
			}
		} catch (error) {
			console.error('[@owservable] -> ObservableDatabase Error cleaning up old stream:', error);
		}

		this._initializeStream();
	}
}
export default ObservableDatabase;
