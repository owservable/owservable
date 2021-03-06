'use strict';

import OwservableClient from './owservable.client';

// _enums
import EStoreType from './_enums/store.type.enum';

// _types
import ConnectionManagerRefreshType from './_types/connection.manager.refresh.type';
import CronJobType from './_types/cronjob.type';
import StoreScopeType from './_types/store.scope.type';
import StoreSubscriptionConfigType from './_types/store.subscription.config.type';
import StoreSubscriptionUpdateType from './_types/store.subscription.update.type';
import SubscriptionMethodsType from './_types/subscription.methods.type';
import WatcherType from './_types/watcher.type';
import WorkerType from './_types/worker.type';

// auth
import IConnectionManager from './auth/i.connection.manager';

// functions
import initiateWorkers from './functions/initiate.workers';
import initiateCronjobs from './functions/initiate.cronjobs';
import initiateWatchers from './functions/initiate.watchers';

// middleware
import DataMiddlewareMap from './middleware/data.middleware.map';

// mongodb
import MongoDBConnector from './mongodb/mongodb.connector';
import CollectionsModelsMap from './mongodb/collections.models.map';

// mongodb functions
import processModels from './mongodb/functions/process.models';
import observableModel from './mongodb/functions/observable.model';
import observableDatabase from './mongodb/functions/observable.database';

// store
import AStore from './store/a.store';
import CountStore from './store/count.store';
import DocumentStore from './store/document.store';
import CollectionStore from './store/collection.store';

// store factories
import storeFactory from './store/factories/store.factory';

export {
	OwservableClient,
	// _enums
	EStoreType,
	// _types
	ConnectionManagerRefreshType,
	CronJobType,
	StoreScopeType,
	StoreSubscriptionConfigType,
	StoreSubscriptionUpdateType,
	SubscriptionMethodsType,
	WatcherType,
	WorkerType,
	// auth
	IConnectionManager,
	// functions
	initiateCronjobs,
	initiateWatchers,
	initiateWorkers,
	// middleware
	DataMiddlewareMap,
	// mongodb
	MongoDBConnector,
	CollectionsModelsMap,
	// mongodb functions
	processModels,
	observableModel,
	observableDatabase,
	// store
	AStore,
	CountStore,
	DocumentStore,
	CollectionStore,
	// store factories
	storeFactory
};

const Owservable = {};
export default Owservable;
