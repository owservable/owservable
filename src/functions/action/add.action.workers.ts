'use strict';

import {isFunction, set} from 'lodash';

import {ActionAsWorkerInterface} from '@owservable/actions';
import {listSubfoldersFilesByFolderName} from '@owservable/folders';

import WorkerType from '../../_types/worker.type';
import executeWorker from '../execute/execute.worker';

export default function addActionWorkers(root: string, folderName: string) {
	const actionPaths: string[] = listSubfoldersFilesByFolderName(root, folderName);

	for (const actionPath of actionPaths) {
		console.log('[@owservable] -> Initializing worker action', actionPath);
		// tslint:disable-next-line:callable-types
		const ActionClass: new () => ActionAsWorkerInterface = require(actionPath).default;
		const action: ActionAsWorkerInterface = new ActionClass();

		if (isFunction(action.asWorker)) {
			const job: WorkerType = {
				work: action.asWorker
			};
			if (isFunction(action.asWorkerInit)) set(job, 'init', action.asWorkerInit());

			executeWorker(job);
		}
	}
}
