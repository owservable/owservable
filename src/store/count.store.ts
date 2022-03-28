'use strict';

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
		return false;
	}

	protected async load(change: any): Promise<void> {
		if (isEmpty(this._config)) return this.emitOne();
		const count = await this._model.countDocuments(this._query);
		this.emitOne(count);
	}
}
