#!/usr/bin/env node
'use strict';

import {pick} from 'lodash';
import {Subject} from 'rxjs';
import {Model} from 'mongoose';
import {ChangeStream} from 'mongodb';

class ObservableModel extends Subject<any> {
	private _model: Model<any>;
	private _stream: ChangeStream;

	constructor(model: Model<any>) {
		super();
		this._model = model;
		this._stream = this._model.watch([], {fullDocument: 'updateLookup'});

		this._stream.on('change', (change) => {
			this.next(pick(change, ['ns', 'documentKey', 'operationType', 'updateDescription', 'fullDocument']));
		});
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
		if (!map.get(collectionName)) map.set(collectionName, new ObservableModel(model));
		return map.get(collectionName);
	}

	private readonly _map: Map<string, ObservableModel>;

	private constructor() {
		this._map = new Map<string, ObservableModel>();
	}
}

const observableModel = (model: Model<any>): Subject<any> => ObservableModelsMap.get(model);
export default observableModel;
