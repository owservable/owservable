'use strict';

import OwservableClient from './owservable.client';

import EStoreType from './enums/store.type.enum';

import type ConnectionManagerRefreshType from './types/connection.manager.refresh.type';
import type CronJobType from './types/cronjob.type';
import type LifecycleEvent from './types/lifecycle.event.type';
import type StoreScopeType from './types/store.scope.type';
import type StoreSubscriptionConfigType from './types/store.subscription.config.type';
import type StoreSubscriptionUpdateType from './types/store.subscription.update.type';
import type SubscriptionMethodsType from './types/subscription.methods.type';
import type WatcherType from './types/watcher.type';
import type WorkerType from './types/worker.type';

import type IConnectionManager from './auth/i.connection.manager';

import initiateWorkers from './functions/initiate.workers';
import initiateCronjobs from './functions/initiate.cronjobs';
import initiateWatchers from './functions/initiate.watchers';

import addActionCronjobs from './functions/action/add.action.cronjobs';
import addActionWatchers from './functions/action/add.action.watchers';
import addActionWorkers from './functions/action/add.action.workers';

import executeCronjob from './functions/execute/execute.cronjob';
import executeWatcher from './functions/execute/execute.watcher';
import executeWorker from './functions/execute/execute.worker';
import executeProcessesInFolder from './functions/execute/execute.processes.in.folder';
import executeOnFilesRecursively from './functions/execute/execute.on.files.recursively';

import DataMiddlewareMap from './middleware/data.middleware.map';

import MongoDBConnector from './mongodb/mongodb.connector';
import CollectionsModelsMap from './mongodb/collections.models.map';

import processModels from './mongodb/functions/process.models';
import observableModel from './mongodb/functions/observable.model.factory';
import observableDatabase from './mongodb/functions/observable.database.factory';
import addIndexToAttributes from './mongodb/functions/index/add.index.to.attributes';
import addUpIndicesToAttributes from './mongodb/functions/index/add.up.indices.to.attributes';
import addDownIndicesToAttributes from './mongodb/functions/index/add.down.indices.to.attributes';
import addUpAndDownIndicesToAttributes from './mongodb/functions/index/add.up.and.down.indices.to.attributes';

import AStore from './store/a.store';
import CountStore from './store/count.store';
import DocumentStore from './store/document.store';
import CollectionStore from './store/collection.store';

import storeFactory from './store/factories/store.factory';

export {
	OwservableClient,
	EStoreType,
	initiateCronjobs,
	initiateWatchers,
	initiateWorkers,
	addActionCronjobs,
	addActionWatchers,
	addActionWorkers,
	executeCronjob,
	executeWatcher,
	executeWorker,
	executeProcessesInFolder,
	executeOnFilesRecursively,
	DataMiddlewareMap,
	MongoDBConnector,
	CollectionsModelsMap,
	processModels,
	observableModel,
	observableDatabase,
	addIndexToAttributes,
	addUpIndicesToAttributes,
	addDownIndicesToAttributes,
	addUpAndDownIndicesToAttributes,
	AStore,
	CountStore,
	DocumentStore,
	CollectionStore,
	storeFactory
};
export type {
	ConnectionManagerRefreshType,
	CronJobType,
	LifecycleEvent,
	StoreScopeType,
	StoreSubscriptionConfigType,
	StoreSubscriptionUpdateType,
	SubscriptionMethodsType,
	WatcherType,
	WorkerType,
	IConnectionManager
};
const Owservable = {};
export default Owservable;
