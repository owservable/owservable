'use strict';

import sift from 'sift';
import * as _ from 'lodash';

import {asyncScheduler} from 'rxjs';
import {filter, throttleTime} from 'rxjs/operators';

import AStore from './a.store';
import EStoreType from '../_enums/store.type.enum';
import observableModel from '../mongodb/functions/observable.model';

// TODO: extract to a pure function file
// tslint:disable-next-line:variable-name
const _getIdFromQuery = (query: any): string => (_.isString(query) ? query : _.get(query, '_id', '').toString());

export default class DocumentStore extends AStore {
	constructor(model: any, target: string) {
		super(model, target);
		this._type = EStoreType.DOCUMENT;
		Object.setPrototypeOf(this, DocumentStore.prototype);
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();

		const {skip = 0} = this._config;
		this._paging = skip ? {} : {skip, limit: 1};
	}

	public restartSubscription(): void {
		this.subscription = observableModel(this.model) //
			.pipe(throttleTime(this._delay, asyncScheduler, {leading: true, trailing: true}))
			.pipe(filter((change) => this._pipeFilter(change)))
			.subscribe({
				next: (change: any): Promise<void> => this.load(change)
			});
	}

	protected shouldReload(change: any): boolean {
		if (this.isInitialSubscription(change)) return true;

		const id = _getIdFromQuery(this._query);
		const {operationType: type, documentKey, updateDescription: description} = change;
		const key = _.get(documentKey, '_id', '').toString();

		switch (type) {
			case 'delete':
				return true;

			case 'insert':
				return !id;

			case 'replace':
			case 'update':
				if (id && id === key) return true;
				if (!description) return true;

				if (!this.shouldConsiderFields()) return true;

				const {updatedFields, removedFields} = description;
				const us = _.concat(removedFields, _.keys(updatedFields));
				const qs = _.keys(this._fields);
				return !_.isEmpty(_.intersection(qs, us));
		}

		return false;
	}

	protected async load(change: any): Promise<void> {
		if (_.isEmpty(this._config)) return this.emitOne();
		if (!this.shouldReload(change)) return;

		const id = _getIdFromQuery(this._query);
		const {operationType: type, documentKey} = change;
		const key = _.get(documentKey, '_id', '').toString();

		if (type === 'delete' && id === key) return this.emitDelete(key);

		// console.log('ows -> DB Reload Document for query:', this._query);
		try {
			let data;
			if (!_.isEmpty(this._sort)) data = await this._loadSortedFirstDocument();
			else data = id ? await this._loadDocumentById(id) : await this._loadDocument();

			if (!data) return this.emitOne();

			for (const populate of this._populates) {
				if (data?.populate) await data.populate(populate).execPopulate();
			}

			if (_.isEmpty(this._virtuals)) return this.emitOne(data.toJSON());

			const jsonData: any = _.cloneDeep(_.omit(data.toJSON(), this._virtuals));
			for (const virtual of this._virtuals) {
				jsonData[virtual] = await Promise.resolve(data[virtual]);
			}
			this.emitOne(jsonData);
		} catch (error) {
			this.emitError(error);
		}
	}

	// TODO: extract to a pure function file
	private _pipeFilter(change: any): boolean {
		if (!_.isEmpty(this._sort)) return true;

		const {operationType: type} = change;
		if ('delete' === type) return true;

		const {documentKey, fullDocument: document} = change;
		const key = _.get(documentKey, '_id', '').toString();
		if (key === _getIdFromQuery(this._query)) return true;

		const test = sift(_.omit(this._query, ['createdAt', 'updatedAt']));
		return test(document);
	}

	private async _loadDocumentById(id: string): Promise<any> {
		return this._model.findById(id, this._fields);
	}

	private async _loadSortedFirstDocument(): Promise<any> {
		const docs = await this._model //
			.find(this._query, this._fields, this._paging)
			.collation({locale: 'en'})
			.sort(this._sort) // @ts-ignore
			.setOptions({allowDiskUse: true});
		return _.first(docs);
	}

	private async _loadDocument(): Promise<any> {
		return this._model.findOne(this._query, this._fields);
	}
}
