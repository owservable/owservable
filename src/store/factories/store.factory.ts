#!/usr/bin/env node
'use strict';

import {Model} from 'mongoose';

import AStore from '../a.store';
import CountStore from '../count.store';
import CollectionsModelsMap from '../../mongodb/collections.models.map';
import CollectionStore from '../collection.store';
import DocumentStore from '../document.store';
import StoreScopeType from '../../_types/store.scope.type';

const storeFactory = (scope: StoreScopeType, observe: string, target: string): AStore => {
	const model: Model<any> = CollectionsModelsMap.getModelByCollection(observe);
	if (scope === 'many') return new CollectionStore(model, target);
	if (scope === 'count') return new CountStore(model, target);
	return new DocumentStore(model, target);
};
export default storeFactory;
