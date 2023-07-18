'use strict';

import sift from 'sift';
import {randomUUID} from 'node:crypto';
import * as jsondiffpatch from 'jsondiffpatch';
import {cloneDeep, each, get, includes, isArray, isEmpty, omit, set, values} from 'lodash';

import {Model} from 'mongoose';

import {throttleTime} from 'rxjs/operators';
import {asyncScheduler, Subject, Subscription} from 'rxjs';

import EStoreType from '../_enums/store.type.enum';
import observableModel from '../mongodb/functions/observable.model';
import StoreSubscriptionConfigType from '../_types/store.subscription.config.type';

const diffPatcher = jsondiffpatch.create({
	propertyFilter: (name: string) => name !== 'subscriptionId'
});

// TODO: extract to a pure function file
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

	protected _config: StoreSubscriptionConfigType;
	protected _incremental: boolean = false;

	protected _subscriptionId: string;

	protected _query: any;
	protected _sort: any;
	protected _fields: any;
	protected _paging: any;
	protected _populates: any[];
	protected _virtuals: any[];

	protected _delay: number;

	protected _subscription: Subscription;

	protected _subscriptionDiffs: Map<string, boolean>;

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
		this._delay = 50;

		this._subscriptionDiffs = new Map<string, boolean>();
	}

	public destroy(): void {
		this._subscription?.unsubscribe();
		delete this._subscription;
	}

	public restartSubscription(): void {
		this.subscription = observableModel(this.model) //
			.pipe(throttleTime(this._delay, asyncScheduler, {leading: true, trailing: true}))
			.subscribe({
				next: (change: any): Promise<void> => this.load(change)
			});
	}

	protected isInitialSubscription(change: any): boolean {
		return isEmpty(change);
	}

	protected abstract shouldReload(change: any): boolean;

	protected abstract load(change: any): Promise<void>;

	protected extractFromConfig(): void {
		const {subscriptionId = randomUUID(), query = {}, sort = {}, fields = {}, populates = [], virtuals = [], delay = 50} = this._config;

		this._subscriptionId = subscriptionId;

		this._query = query;
		this._sort = sort;

		this._populates = populates;
		this._virtuals = virtuals;

		this._delay = delay;

		if (isArray(fields)) {
			this._fields = {};
			each(fields, (field: string) => set(this._fields, field, 1));
		} else {
			this._fields = fields;
		}
	}

	protected testDocument(document: any): boolean {
		try {
			const test = sift(omit(this._query, ['createdAt', 'updatedAt']));
			return test(document);
		} catch (error) {
			console.error('[@owservable] -> AStore::testDocument Error:', {query: this._query, document, error});
			return true;
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

	protected emitOne(subscriptionId: string, update: any = {}): void {
		const message = _baseMessage(this._target, this._incremental);
		set(message.payload, this._target, update);
		this.next({
			subscriptionId,
			...message
		});
	}

	protected emitMany(subscriptionId: string, update: any = {total: 0, data: []}): void {
		const {total, data} = update;
		const message = _baseMessage(this._target, this._incremental);
		set(message.payload, this._target, data);
		if (!this._incremental && total >= 0) set(message.payload, '_' + this._target + 'Count', total);
		this.next({
			subscriptionId,
			...message
		});
	}

	protected emitDelete(subscriptionId: string, deleted: any): void {
		this.next({
			subscriptionId,
			type: 'delete',
			target: this._target,
			payload: deleted
		});
	}

	protected emitError(subscriptionId: string, error: any): void {
		this.next({
			subscriptionId,
			type: 'error',
			error,
			target: this._target,
			query: this._query,
			sort: this._sort,
			fields: this._fields,
			paging: this._paging,
			populates: this._populates,
			virtuals: this._virtuals
		});
	}

	protected shouldConsiderFields(): boolean {
		return !isEmpty(this._fields) && !includes(values(this._fields), 0);
	}

	public set config(config: StoreSubscriptionConfigType) {
		if (!this._isValidConfig(config)) return;

		config.subscriptionId = config.subscriptionId || randomUUID();

		if (this._type === EStoreType.COLLECTION) {
			const queryDiff = jsondiffpatch.diff(get(this._config, 'query', {}), get(config, 'query', {}));
			this._addSubscriptionDiff(config.subscriptionId, !isEmpty(queryDiff));
		}

		this._config = cloneDeep(config);

		this.extractFromConfig();
		this.restartSubscription();
	}

	public get target(): string {
		return this._target;
	}

	// TODO: extract to a pure function file
	private _isValidConfig(config: StoreSubscriptionConfigType): boolean {
		if (!config) return false;

		const diff = diffPatcher.diff(this._config, config);
		return !isEmpty(diff);
	}

	private _addSubscriptionDiff(subId: string, diff: boolean) {
		this._subscriptionDiffs.set(subId, diff);
	}

	protected removeSubscriptionDiff(subId: string) {
		this._subscriptionDiffs.delete(subId);
	}

	protected isQueryChange(subId: string): boolean {
		return !!this._subscriptionDiffs.get(subId);
	}
}
