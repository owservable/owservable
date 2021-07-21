#!/usr/bin/env node
'use strict';

import {pick} from 'lodash';
import {Subject} from 'rxjs';
import * as mongoose from 'mongoose';
import {ChangeStream} from 'mongodb';

// TODO: Available from MongoDB 4.0
// observableDatabase()
// 	.pipe(filter((change) => _.get(change, 'ns.coll') === model.collection.collectionName)
// 		.subscribe({
// 			next: (change: any): void => console.log(change)
// 		});

class ObservableDatabase extends Subject<any> {
	private _stream: ChangeStream;
	private static _instance: ObservableDatabase;

	public static init(): ObservableDatabase {
		if (!ObservableDatabase._instance) ObservableDatabase._instance = new ObservableDatabase();
		return ObservableDatabase._instance;
	}

	constructor() {
		super();
		const db = mongoose.connection.db;
		this._stream = db.watch([], {fullDocument: 'updateLookup'});
		this._stream.on('change', (change) => {
			this.next(pick(change, ['ns', 'documentKey', 'operationType', 'updateDescription', 'fullDocument']));
		});
	}
}

const observableDatabase = (): Subject<any> => ObservableDatabase.init();
export default observableDatabase;
