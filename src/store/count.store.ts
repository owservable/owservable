'use strict';

import * as _ from 'lodash';
import {isEmpty} from 'lodash';
import {Model} from 'mongoose';

import AStore from './a.store';
import EStoreType from '../_enums/store.type.enum';

export default class CountStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COUNT;
		Object.setPrototypeOf(this, CountStore.prototype);
	}

	protected shouldReload(change: any): boolean {
		if (_.isEmpty(change)) return false;

		const {operationType: type} = change;
		switch (type) {
			case 'delete':
			case 'insert':
				return true;

			case 'replace':
			case 'update':
			default:
				return false;
		}
	}

	protected async load(change: any): Promise<void> {
		if (isEmpty(this._config)) return this.emitOne();
		if (!this.shouldReload(change)) return;

		const count = await this._model.countDocuments(this._query);
		this.emitOne(count);
	}
}
