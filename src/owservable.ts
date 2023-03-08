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
import addBothIndicesToAttributes from './mongodb/functions/index/add.both.indices.to.attributes';
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
	addBothIndicesToAttributes,
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
