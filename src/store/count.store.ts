'use strict';
import {isEmpty} from 'lodash';
import {Model} from 'mongoose';

import AStore from './a.store';
import EStoreType from '../_enums/store.type.enum';
import getHrtimeAsNumber from '../functions/performance/get.hrtime.as.number';

export default class CountStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COUNT;
		Object.setPrototypeOf(this, CountStore.prototype);
	}

	protected shouldReload(change: any): boolean {
		if (this.isInitialSubscription(change)) return true;

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
		const startTime: number = getHrtimeAsNumber();

		if (isEmpty(this._config)) return this.emitOne(startTime, this._subscriptionId);
		if (!this.shouldReload(change)) return;

		const count = await this._model.countDocuments(this._query);
		this.emitOne(startTime, this._subscriptionId, count);
	}
}
