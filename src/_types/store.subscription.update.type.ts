#!/usr/bin/env node
'use strict';

import StoreScopeType from './store.scope.type';
import StoreSubscriptionConfigType from './store.subscription.config.type';

type StoreSubscriptionUpdateType = {
	target: string;
	scope: StoreScopeType;
	config: StoreSubscriptionConfigType;

	// use if mongodb is the only reactive source
	observe: string; // collectionName

	// use when more than one reactive source exists, to distinguish between them
	// observe: {
	// 	source: "mongodb",
	// 	name: string			// collectionName
	// }
};
export default StoreSubscriptionUpdateType;
