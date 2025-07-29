'use strict';

import {ActionAsWorkerInterface} from '@owservable/actions';
import {listSubfoldersFilesByFolderName} from '@owservable/folders';

import WorkerType from '../../types/worker.type';
import executeWorker from '../execute/execute.worker';

export default function addActionWorkers(root: string, folderName: string): void {
	const actionPaths: string[] = listSubfoldersFilesByFolderName(root, folderName);

	for (const actionPath of actionPaths) {
		console.log('[@owservable] -> Initializing worker action', actionPath);
		// tslint:disable-next-line:callable-types
		const ActionClass: new () => ActionAsWorkerInterface = require(actionPath).default;
		const action: ActionAsWorkerInterface = new ActionClass();

		if (typeof action.asWorker === 'function') {
			const job: WorkerType = {
				...(action.asWorkerInit && {init: action.asWorkerInit}),
				work: action.asWorker
			};
			if (typeof action.asWorkerInit === 'function') job.init = action.asWorkerInit;

			executeWorker(job);
		}
	}
}
