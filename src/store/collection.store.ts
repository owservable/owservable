'use strict';

import * as _ from 'lodash';
import {Model} from 'mongoose';

import AStore from './a.store';
import EStoreType from '../_enums/store.type.enum';
import getHrtimeAsNumber from '../functions/performance/get.hrtime.as.number';

require('json-circular-stringify');

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

		const {operationType: type, updateDescription: description, fullDocument: document} = change;
		if (!description) return true;

		const {updatedFields, removedFields} = description;
		const us: string[] = _.concat(removedFields, _.keys(updatedFields));
		if (!_.isEmpty(_.intersection(_.keys(this._query), us))) return true;

		switch (type) {
			case 'delete':
			case 'insert':
				return true;

			case 'replace':
			case 'update':
				if (this.shouldConsiderFields()) return !_.isEmpty(_.intersection(_.keys(this._fields), us));
				return this.testDocument(document);
		}

		return false;
	}

	protected async sendCount(subscriptionId: string): Promise<void> {
		const startTime: number = getHrtimeAsNumber();
		console.log('[@owservable] -> CollectionStore::sendCount', {
			model: this._model.collection.collectionName,
			subscriptionId,
			query: JSON.stringify(this._query)
		});
		this._totalCount = await this._model.countDocuments(this._query);
		this.emitTotal(startTime, subscriptionId, this._totalCount);
	}

	protected delaySendCount: _.DebouncedFuncLeading<any> = _.throttle(this.sendCount, 5000);

	protected async load(change: any): Promise<void> {
		console.log('[@owservable] -> CollectionStore::load', JSON.stringify(change));
		const startTime: number = getHrtimeAsNumber();

		const currentLoadSubscriptionId = this._subscriptionId + '';

		// console.log('[@owservable] -> CollectionStore load', change, this._target, this._query, this._sort, this._fields, this._paging);
		if (_.isEmpty(this._config)) return this.emitMany(startTime, currentLoadSubscriptionId);
		if (!this.shouldReload(change)) return;

		// console.log('[@owservable] -> DB Reload Collection for query:', {query: this._query, sort: this._sort, paging: this._paging, fields: this._fields});
		try {
			const {operationType: type, documentKey, fullDocument: document} = change;
			const key = _.get(documentKey, '_id', '').toString();

			if (document && this._incremental) {
				if ('delete' === type) return this.emitDelete(startTime, currentLoadSubscriptionId, key);

				for (const populate of this._populates) {
					await this._model.populate(document, populate);
				}
				if (_.isEmpty(this._virtuals)) return this.emitMany(startTime, currentLoadSubscriptionId, {data: document});

				const replacement: any = _.cloneDeep(_.omit(document.toJSON(), this._virtuals));
				for (const virtual of this._virtuals) {
					replacement[virtual] = await Promise.resolve(document[virtual]);
				}
				return this.emitMany(startTime, currentLoadSubscriptionId, {data: replacement});
			} else {
				let data: any[] = await this._model //
					.find(this._query, this._fields, this._paging)
					// .collation({locale: 'en'})
					.sort(this._sort) // @ts-ignore
					.setOptions({allowDiskUse: true});

				if (!_.isEmpty(this._populates)) {
					for (const populate of this._populates) {
						await this._model.populate(data, populate);
					}
				}

				if (!_.isEmpty(this._virtuals)) {
					const replacements: any[] = [];
					for (const item of data) {
						const replacement: any = _.cloneDeep(_.omit(item.toJSON(), this._virtuals));
						for (const virtual of this._virtuals) {
							replacement[virtual] = await Promise.resolve(item[virtual]);
						}
						replacements.push(replacement);
					}
					data = replacements;
				}

				if (this.isQueryChange(currentLoadSubscriptionId)) {
					this.emitMany(startTime, currentLoadSubscriptionId, {total: this._totalCount, data, recounting: true});

					await this.sendCount(currentLoadSubscriptionId);

					//
				} else {
					this.emitMany(startTime, currentLoadSubscriptionId, {total: this._totalCount, data});

					this.delaySendCount(currentLoadSubscriptionId);
				}

				this.removeSubscriptionDiff(currentLoadSubscriptionId);
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
