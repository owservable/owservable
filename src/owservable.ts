'use strict';

import OwservableClient from './owservable.client';

// enums
import EStoreType from './enums/store.type.enum';

// types
import ConnectionManagerRefreshType from './types/connection.manager.refresh.type';
import CronJobType from './types/cronjob.type';
import StoreScopeType from './types/store.scope.type';
import StoreSubscriptionConfigType from './types/store.subscription.config.type';
import StoreSubscriptionUpdateType from './types/store.subscription.update.type';
import SubscriptionMethodsType from './types/subscription.methods.type';
import WatcherType from './types/watcher.type';
import WorkerType from './types/worker.type';

// auth
import IConnectionManager from './auth/i.connection.manager';

// functions
import initiateWorkers from './functions/initiate.workers';
import initiateCronjobs from './functions/initiate.cronjobs';
import initiateWatchers from './functions/initiate.watchers';

// functions action
import addActionCronjobs from './functions/action/add.action.cronjobs';
import addActionWatchers from './functions/action/add.action.watchers';
import addActionWorkers from './functions/action/add.action.workers';

// functions execute
import executeCronjob from './functions/execute/execute.cronjob';
import executeWatcher from './functions/execute/execute.watcher';
import executeWorker from './functions/execute/execute.worker';
import executeProcessesInFolder from './functions/execute/execute.processes.in.folder';
import executeOnFilesRecursively from './functions/execute/execute.on.files.recursively';

// middleware
import DataMiddlewareMap from './middleware/data.middleware.map';

// mongodb
import MongoDBConnector from './mongodb/mongodb.connector';
import CollectionsModelsMap from './mongodb/collections.models.map';

// mongodb functions
import processModels from './mongodb/functions/process.models';
import observableModel from './mongodb/functions/observable.model';
import observableDatabase from './mongodb/functions/observable.database';
import addIndexToAttributes from './mongodb/functions/index/add.index.to.attributes';
import addUpIndicesToAttributes from './mongodb/functions/index/add.up.indices.to.attributes';
import addDownIndicesToAttributes from './mongodb/functions/index/add.down.indices.to.attributes';
import addUpAndDownIndicesToAttributes from './mongodb/functions/index/add.up.and.down.indices.to.attributes';

// store
import AStore from './store/a.store';
import CountStore from './store/count.store';
import DocumentStore from './store/document.store';
import CollectionStore from './store/collection.store';

// store factories
import storeFactory from './store/factories/store.factory';

export {
	OwservableClient,

	// enums
	EStoreType,

	// types
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

	// functions action
	addActionCronjobs,
	addActionWatchers,
	addActionWorkers,

	// functions execute
	executeCronjob,
	executeWatcher,
	executeWorker,
	executeProcessesInFolder,
	executeOnFilesRecursively,

	// middleware
	DataMiddlewareMap,

	// mongodb
	MongoDBConnector,
	CollectionsModelsMap,

	// mongodb functions
	processModels,
	observableModel,
	observableDatabase,
	addIndexToAttributes,
	addUpIndicesToAttributes,
	addDownIndicesToAttributes,
	addUpAndDownIndicesToAttributes,

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
