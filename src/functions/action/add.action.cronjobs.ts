'use strict';

import {isFunction, set} from 'lodash';

import {ActionAsCronjobInterface} from '@owservable/actions';
import {listSubfoldersFilesByFolderName} from '@owservable/folders';

import CronJobType from '../../_types/cronjob.type';
import executeCronjob from '../execute/execute.cronjob';

export default function addActionCronjobs(root: string, folderName: string) {
	const actionPaths: string[] = listSubfoldersFilesByFolderName(root, folderName);

	for (const actionPath of actionPaths) {
		console.log('[@owservable] -> Initializing cronjob action', actionPath);
		// tslint:disable-next-line:callable-types
		const ActionClass: {new (): ActionAsCronjobInterface} = require(actionPath).default;
		const action: ActionAsCronjobInterface = new ActionClass();

		if (isFunction(action.schedule) && isFunction(action.asCronjob)) {
			const job: CronJobType = {
				schedule: action.schedule(),
				job: action.asCronjob
			};

			if (isFunction(action.cronjobOptions)) set(job, 'options', action.cronjobOptions());
			if (isFunction(action.asCronjobInit)) set(job, 'init', action.asCronjobInit());

			executeCronjob(job);
		}
	}
}
