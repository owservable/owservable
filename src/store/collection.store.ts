'use strict';

import * as _ from 'lodash';
import {Model} from 'mongoose';

import AStore from './a.store';
import EStoreType from '../_enums/store.type.enum';
import getHrtimeAsNumber from '../functions/performance/get.hrtime.as.number';

export default class CollectionStore extends AStore {
	private _totalCount: number;

	constructor(model: Model<any>, target: string) {
		super(model, target);

		this._totalCount = -1;
		this._type = EStoreType.COLLECTION;
		Object.setPrototypeOf(this, CollectionStore.prototype);
	}

	protected shouldReload(change: any): boolean {
		if (this.isInitialSubscription(change)) return true;

		const {operationType, updateDescription, fullDocument} = change;
		if (!updateDescription) return true;

		const {updatedFields, removedFields} = updateDescription;
		const us: string[] = _.concat(removedFields, _.keys(updatedFields));
		if (!_.isEmpty(_.intersection(_.keys(this._query), us))) return true;

		switch (operationType) {
			case 'delete':
			case 'insert':
				return true;

			case 'replace':
			case 'update':
				if (this.shouldConsiderFields()) return !_.isEmpty(_.intersection(_.keys(this._fields), us));
				return this.testDocument(fullDocument);
		}

		return false;
	}

	protected async sendCount(subscriptionId: string): Promise<void> {
		const startTime: number = getHrtimeAsNumber();
		this._totalCount = await this._model.countDocuments(this._query);
		this.emitTotal(startTime, subscriptionId, this._totalCount);
	}

	protected delaySendCount: _.DebouncedFuncLeading<any> = _.throttle(this.sendCount, 5000);

	protected async loadIncremental(startTime: number, currentLoadSubscriptionId: string, change: any): Promise<void> {
		const {operationType, documentKey, fullDocument} = change;

		const key = _.get(documentKey, '_id', '').toString();
		if ('delete' === operationType) return this.emitDelete(startTime, currentLoadSubscriptionId, key);

		for (const populate of this._populates) {
			await this._model.populate(fullDocument, populate);
		}

		let document: any = fullDocument;
		if (!_.isEmpty(this._virtuals)) {
			document = _.cloneDeep(_.omit(fullDocument.toJSON(), this._virtuals));
			for (const virtual of this._virtuals) {
				document[virtual] = await Promise.resolve(fullDocument[virtual]);
			}
		}
		return this.emitMany(startTime, currentLoadSubscriptionId, {data: document});
	}

	protected async loadAll(startTime: number, currentLoadSubscriptionId: string): Promise<void> {
		let documents: any[] = await this._model //
			.find(this._query, this._fields, this._paging)
			.sort(this._sort) // @ts-ignore
			.setOptions({allowDiskUse: true});

		for (const populate of this._populates) {
			await this._model.populate(documents, populate);
		}

		if (!_.isEmpty(this._virtuals)) {
			const replacements: any[] = [];
			for (const document of documents) {
				const replacement: any = _.cloneDeep(_.omit(document.toJSON(), this._virtuals));
				for (const virtual of this._virtuals) {
					replacement[virtual] = await Promise.resolve(document[virtual]);
				}
				replacements.push(replacement);
			}
			documents = replacements;
		}

		if (this.isQueryChange(currentLoadSubscriptionId)) {
			this.emitMany(startTime, currentLoadSubscriptionId, {total: this._totalCount, data: documents, recounting: true});
			await this.sendCount(currentLoadSubscriptionId);

			//
		} else {
			this.emitMany(startTime, currentLoadSubscriptionId, {total: this._totalCount, data: documents});
			this.delaySendCount(currentLoadSubscriptionId);
		}

		this.removeSubscriptionDiff(currentLoadSubscriptionId);
	}

	protected async load(change: any): Promise<void> {
		const startTime: number = getHrtimeAsNumber();

		const currentLoadSubscriptionId: string = this._subscriptionId + '';

		if (_.isEmpty(this._config)) return this.emitMany(startTime, currentLoadSubscriptionId);
		if (!this.shouldReload(change)) return;

		try {
			const {fullDocument} = change;
			if (fullDocument && this._incremental) {
				await this.loadIncremental(startTime, currentLoadSubscriptionId, change);
			} else {
				await this.loadAll(startTime, currentLoadSubscriptionId);
			}
		} catch (error) {
			console.error('[@owservable] -> CollectionStore::load Error:', {change, error});
			this.emitError(startTime, currentLoadSubscriptionId, error);
		}
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();

		const {incremental = false, page = 1, pageSize} = this._config;
		this._incremental = incremental;

		this._paging = {};
		if (pageSize) {
			this._paging = {
				skip: (page - 1) * pageSize,
				limit: pageSize
			};
		}
	}
}
