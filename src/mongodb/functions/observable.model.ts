'use strict';

import mongoose from 'mongoose';
import {ChangeStream} from 'mongodb';

import {ReplaySubject, Subject} from 'rxjs';

import LifecycleEvent from '../../types/lifecycle.event.type';

class ObservableModel extends Subject<any> {
	private readonly _collection: string;
	private _stream: ChangeStream;
	public readonly lifecycle: ReplaySubject<LifecycleEvent>;

	constructor(collection: string) {
		super();
		this._collection = collection;
		this.lifecycle = new ReplaySubject<LifecycleEvent>(1);

		this._initializeStream();
	}

	private _initializeStream(): void {
		const db: mongoose.mongo.Db = mongoose.connection.db;
		const collectionObj: mongoose.mongo.Collection = db.collection(this._collection);

		this._stream = collectionObj.watch([], {fullDocument: 'updateLookup'});

		this._stream.on('change', (change: any): void => {
			try {
				const {ns, documentKey, operationType, updateDescription, fullDocument} = change;
				this.next({ns, documentKey, operationType, updateDescription, fullDocument});
			} catch (error) {
				console.error(`[@owservable] -> ObservableModel[${this._collection}] Error in change event:`, error);
				this.lifecycle.next({
					type: 'error',
					collection: this._collection,
					timestamp: new Date(),
					error
				});
			}
		});

		this._stream.on('error', (error: any): void => {
			console.error(`[@owservable] -> ObservableModel[${this._collection}] ChangeStream error event:`, error, ', attempting reconnection...');
			this.lifecycle.next({
				type: 'error',
				collection: this._collection,
				timestamp: new Date(),
				error
			});
			this._reconnect();
		});

		this._stream.on('close', (): void => {
			console.warn(`[@owservable] -> ObservableModel[${this._collection}] ChangeStream close event: stream has closed, attempting reconnection...`);
			this.lifecycle.next({
				type: 'close',
				collection: this._collection,
				timestamp: new Date()
			});
			this._reconnect();
		});

		this._stream.on('end', (): void => {
			console.warn(`[@owservable] -> ObservableModel[${this._collection}] ChangeStream end event: stream has ended, attempting reconnection...`);
			this.lifecycle.next({
				type: 'end',
				collection: this._collection,
				timestamp: new Date()
			});
			this._reconnect();
		});

		this.lifecycle.next({
			type: 'live',
			collection: this._collection,
			timestamp: new Date()
		});
	}

	private _reconnect(): void {
		console.info(`[@owservable] -> ObservableModel[${this._collection}] Reconnecting ChangeStream...`);
		try {
			if (this._stream) {
				this._stream.removeAllListeners();
			}
		} catch (error) {
			console.error(`[@owservable] -> ObservableModel[${this._collection}] Error cleaning up old stream:`, error);
		}

		this._initializeStream();
	}
}
export default ObservableModel;
