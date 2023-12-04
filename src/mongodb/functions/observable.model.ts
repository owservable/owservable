'use strict';

import {pick} from 'lodash';
import {Model} from 'mongoose';

import {Subject, Subscription} from 'rxjs';
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
				next: (change: any): void => this.next(pick(change, ['ns', 'documentKey', 'operationType', 'updateDescription', 'fullDocument'])),
				error: (e: any): void => this.error(e),
				complete: (): void => this.complete()
			});
	}

	private _pipeFilter(change: any): boolean {
		try {
			const {
				ns: {coll}
			} = change;

			return this._collection === coll;
		} catch (error) {
			return false;
		}
	}
}

class ObservableModelsMap {
	private static _instance: ObservableModelsMap;

	public static init(): ObservableModelsMap {
		if (!ObservableModelsMap._instance) ObservableModelsMap._instance = new ObservableModelsMap();
		return ObservableModelsMap._instance;
	}

	public static get(model: Model<any>): ObservableModel {
		const instance: ObservableModelsMap = ObservableModelsMap.init();
		const map: Map<string, ObservableModel> = instance._map;

		const collectionName: string = model.collection.collectionName;
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
