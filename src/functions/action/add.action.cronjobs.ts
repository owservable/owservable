'use strict';

import {ActionAsCronjobInterface} from '@owservable/actions';
import {listSubfoldersFilesByFolderName} from '@owservable/folders';

import CronJobType from '../../types/cronjob.type';
import executeCronJob from '../execute/execute.cronjob';

export default function addActionCronjobs(root: string, folderName: string): void {
	const actionPaths: string[] = listSubfoldersFilesByFolderName(root, folderName);

	for (const actionPath of actionPaths) {
		console.log('[@owservable] -> Initializing cronjob action', actionPath);
		// tslint:disable-next-line:callable-types
		const ActionClass: new () => ActionAsCronjobInterface = require(actionPath).default;
		const action: ActionAsCronjobInterface = new ActionClass();

		if (typeof action.asCronjob === 'function') {
			const job: CronJobType = {
				schedule: action.schedule(),
				...(action.asCronjobInit && {init: action.asCronjobInit}),
				job: action.asCronjob
			};
			if (typeof action.asCronjobInit === 'function') job.init = action.asCronjobInit;

			executeCronJob(job);
		}
	}
}
