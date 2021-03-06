'use strict';

import sift from 'sift';
import * as _ from 'lodash';
import {Model} from 'mongoose';

import AStore from './a.store';
import EStoreType from '../_enums/store.type.enum';

export default class CollectionStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COLLECTION;
		Object.setPrototypeOf(this, CollectionStore.prototype);
	}

	protected shouldReload(change: any): boolean {
		if (_.isEmpty(change)) return true;

		const {operationType: type, updateDescription: description, fullDocument: document} = change;

		const test = sift(_.omit(this._query, ['createdAt', 'updatedAt']));
		switch (type) {
			case 'delete':
				return true;

			case 'insert':
				if (!_.isEmpty(this._query)) return test(document);
				break;

			case 'replace':
			case 'update':
				if (!description) return true;

				let us = [];
				const {updatedFields, removedFields} = description;
				us = _.concat(removedFields, _.keys(updatedFields));

				const qs = this.shouldConsiderFields() ? _.keys(this._fields) : [];
				return !_.isEmpty(_.intersection(qs, us)) || test(document);
		}

		return false;
	}

	protected async load(change: any): Promise<void> {
		// console.log('ows -> CollectionStore load', change, this._target, this._query, this._sort, this._fields, this._paging);
		if (_.isEmpty(this._config)) return this.emitMany();
		if (!this.shouldReload(change)) return;

		// console.log('ows -> DB Reload Collection for query:', {query: this._query, sort: this._sort, paging: this._paging, fields: this._fields});
		try {
			const {operationType: type, documentKey, fullDocument: document} = change;
			const key = _.get(documentKey, '_id', '').toString();

			if (document && this._incremental) {
				if ('delete' === type) return this.emitDelete(key);

				for (const populate of this._populates) {
					await this._model.populate(document, populate);
				}
				if (_.isEmpty(this._virtuals)) return this.emitMany({data: document});

				const replacement: any = _.cloneDeep(_.omit(document.toJSON(), this._virtuals));
				for (const virtual of this._virtuals) {
					replacement[virtual] = await Promise.resolve(document[virtual]);
				}
				return this.emitMany({data: replacement});
			} else {
				let data = [];
				const total = await this._model.countDocuments(this._query);
				if (total > 0) {
					data = await this._model.find(this._query, this._fields, this._paging).sort(this._sort);

					for (const populate of this._populates) {
						await this._model.populate(data, populate);
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
				}

				return this.emitMany({total, data});
			}
		} catch (error) {
			this.emitError(error);
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
