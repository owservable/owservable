'use strict';

import {pick} from 'lodash';
import {Subject} from 'rxjs';
import * as mongoose from 'mongoose';
import {ChangeStream} from 'mongodb';

class ObservableDatabase extends Subject<any> {
	protected _stream: ChangeStream;
	private static _instance: ObservableDatabase;

	public static init(): ObservableDatabase {
		if (!ObservableDatabase._instance) ObservableDatabase._instance = new ObservableDatabase();
		return ObservableDatabase._instance;
	}

	constructor() {
		super();

		const db: mongoose.mongo.Db = mongoose.connection.db;

		this._stream = db.watch([], {fullDocument: 'updateLookup'});
		this._stream.on('change', (change: any): void => {
			this.next(pick(change, ['ns', 'documentKey', 'operationType', 'updateDescription', 'fullDocument']));
		});

		mongoose.connection.on('connected', (): void => {
			console.log('[@owservable] -> MongoDB connected event in ObservableDatabase');

			delete this._stream;
			this._stream = null;

			delete ObservableDatabase._instance;
			ObservableDatabase._instance = null;
		});
	}
}

const observableDatabase = (): Subject<any> => ObservableDatabase.init();
export default observableDatabase;
