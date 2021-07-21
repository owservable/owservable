#!/usr/bin/env node
'use strict';

import {Model} from 'mongoose';
import {Subject, Subscription} from 'rxjs';
import * as jsondiffpatch from 'jsondiffpatch';
import {cloneDeep, each, includes, isArray, isEmpty, set, values} from 'lodash';

import EStoreType from '../_enums/store.type.enum';

// tslint:disable-next-line:variable-name
const _baseMessage = (target: string, incremental = false): any => ({
	type: incremental ? 'increment' : 'update',
	target,
	payload: {}
});

export default abstract class AStore extends Subject<any> {
	protected _model: Model<any>;
	protected _target: string;
	protected _type: EStoreType;

	protected _config: any;
	protected _incremental: boolean = false;

	protected _query: any;
	protected _sort: any;
	protected _fields: any;
	protected _paging: any;
	protected _populates: any[];
	protected _virtuals: any[];

	protected _subscription: Subscription;

	protected constructor(model: Model<any>, target: string) {
		super();

		this._model = model;
		this._target = target;
		this._query = {};
		this._sort = {};
		this._fields = {};
		this._paging = {};
		this._populates = [];
		this._virtuals = [];
	}

	public destroy(): void {
		if (this._subscription) this._subscription.unsubscribe();
		this._subscription = null;
	}

	protected abstract load(change: any): Promise<void>;

	protected abstract restartSubscription(): void;

	protected extractFromConfig(): void {
		const {query = {}, sort = {}, fields = {}, populates = [], virtuals = []} = this._config;
		this._query = query;
		this._sort = sort;
		this._populates = populates;
		this._virtuals = virtuals;

		if (isArray(fields)) {
			this._fields = {};
			each(fields, (field: string) => set(this._fields, field, 1));
		} else {
			this._fields = fields;
		}
	}

	protected set subscription(subscription: Subscription) {
		this.destroy();
		this._subscription = subscription;
		this.load({}).then(() => null);
	}

	protected get model(): Model<any> {
		return this._model;
	}

	protected emitOne(update: any = {}): void {
		const message = _baseMessage(this._target, this._incremental);
		set(message.payload, this._target, update);
		this.next(message);
	}

	protected emitMany(update: any = {total: 0, data: []}): void {
		const {total, data} = update;
		const message = _baseMessage(this._target, this._incremental);
		set(message.payload, this._target, data);
		if (!this._incremental) set(message.payload, '_' + this._target + 'Count', total);
		this.next(message);
	}

	protected emitDelete(deleted: any): void {
		this.next({
			type: 'delete',
			target: this._target,
			payload: deleted
		});
	}

	protected shouldConsiderFields(): boolean {
		return !isEmpty(this._fields) && !includes(values(this._fields), 0);
	}

	public set config(config: any) {
		if (!this._isValidConfig(config)) return;

		this._config = cloneDeep(config);
		this.extractFromConfig();
		this.restartSubscription();
	}

	public get target(): string {
		return this._target;
	}

	private _isValidConfig(config: any): boolean {
		if (!config) return false;
		const diff = jsondiffpatch.diff(this._config, config);
		return !isEmpty(diff);
	}
}
