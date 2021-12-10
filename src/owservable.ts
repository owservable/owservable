'use strict';

import OwservableClient from './owservable.client';

// _enums
import EStoreType from './_enums/store.type.enum';

// _types
import ConnectionManagerRefreshType from './_types/connection.manager.refresh.type';
import CronJobType from './_types/cronjob.type';
import ObserverType from './_types/observer.type';
import StoreScopeType from './_types/store.scope.type';
import StoreSubscriptionConfigType from './_types/store.subscription.config.type';
import StoreSubscriptionUpdateType from './_types/store.subscription.update.type';
import WorkerType from './_types/worker.type';

// auth
import IConnectionManager from './auth/i.connection.manager';

// functions
import initiateWorkers from './functions/initiate.workers';
import initiateCronjobs from './functions/initiate.cronjobs';
import initiateObservers from './functions/initiate.observers';
import getSubfolderPathsByFolderName from './functions/get.subfolder.paths.by.folder.name';

// middleware
import DataMiddlewareMap from './middleware/data.middleware.map';

// mongodb
import MongoDBConnector from './mongodb/mongodb.connector';
import CollectionsModelsMap from './mongodb/collections.models.map';

// mongodb functions
import _processModels from './mongodb/functions/process.models';
import observableModel from './mongodb/functions/observable.model';
import observableDatabase from './mongodb/functions/observable.database';

// routing
import RoutesMap from './routing/routes.map';

// routing functions
import addFastifyRoutes from './routing/functions/add.fastify.routes';
import cleanRelativePath from './routing/functions/clean.relative.path';
import processFastifyBlipp from './routing/functions/process.fastify.blipp';

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
	ObserverType,
	StoreScopeType,
	StoreSubscriptionConfigType,
	StoreSubscriptionUpdateType,
	WorkerType,
	// auth
	IConnectionManager,
	// functions
	getSubfolderPathsByFolderName,
	initiateWorkers,
	initiateObservers,
	initiateCronjobs,
	// middleware
	DataMiddlewareMap,
	// mongodb
	MongoDBConnector,
	CollectionsModelsMap,
	// mongodb functions
	_processModels,
	observableModel,
	observableDatabase,
	// routing
	RoutesMap,
	// routing functions
	addFastifyRoutes,
	cleanRelativePath,
	processFastifyBlipp,
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
