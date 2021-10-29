#!/usr/bin/env node
'use strict';

import {pick} from 'lodash';
import {Subject, Subscription} from 'rxjs';
import {Model} from 'mongoose';
import {filter} from 'rxjs/operators';
import observableDatabase from './observable.database';

class ObservableModel extends Subject<any> {
	private readonly _collection: string;
	protected _subscription: Subscription;

	constructor(collection: string) {
		super();
		this._collection = collection;

		this._subscription = observableDatabase()
			.pipe(filter((change) => this._pipeFilter(change)))
			.subscribe({
				next: (change: any): void => this.next(pick(change, ['ns', 'documentKey', 'operationType', 'updateDescription', 'fullDocument']))
			});
	}

	private _pipeFilter(change: any): boolean {
		const {
			ns: {coll}
		} = change;
		return this._collection === coll;
	}
}

class ObservableModelsMap {
	private static _instance: ObservableModelsMap;

	public static init(): ObservableModelsMap {
		if (!ObservableModelsMap._instance) ObservableModelsMap._instance = new ObservableModelsMap();
		return ObservableModelsMap._instance;
	}

	public static get(model: Model<any>): ObservableModel {
		const instance = ObservableModelsMap.init();
		const map = instance._map;
		const collectionName = model.collection.collectionName;
		if (!map.get(collectionName)) map.set(collectionName, new ObservableModel(collectionName));
		return map.get(collectionName);
	}

	private readonly _map: Map<string, ObservableModel>;

	private constructor() {
		this._map = new Map<string, ObservableModel>();
	}
}

const observableModel = (model: Model<any>): Subject<any> => ObservableModelsMap.get(model);
export default observableModel;
