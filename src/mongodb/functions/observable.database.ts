'use strict';

import {pick} from 'lodash';
import {Subject} from 'rxjs';
import * as mongoose from 'mongoose';
import {ChangeStream} from 'mongodb';

class ObservableDatabase extends Subject<any> {
	private _stream: ChangeStream;
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
	}
}

const observableDatabase = (): Subject<any> => ObservableDatabase.init();
export default observableDatabase;
