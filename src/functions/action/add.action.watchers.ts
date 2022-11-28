'use strict';

import {isFunction, set} from 'lodash';

import {ActionAsWatcherInterface} from '@owservable/actions';
import {listSubfoldersFilesByFolderName} from '@owservable/folders';

import WatcherType from '../../_types/watcher.type';
import executeWatcher from '../execute/execute.watcher';

export default function addActionWatchers(root: string, folderName: string) {
	const actionPaths: string[] = listSubfoldersFilesByFolderName(root, folderName);

	for (const actionPath of actionPaths) {
		console.log('   - [@owservable] Initializing watcher action', actionPath);
		// tslint:disable-next-line:callable-types
		const ActionClass: {new (): ActionAsWatcherInterface} = require(actionPath).default;
		const action: ActionAsWatcherInterface = new ActionClass();

		if (isFunction(action.asWatcher)) {
			const job: WatcherType = {
				watch: action.asWatcher
			};
			if (isFunction(action.asWatcherInit)) set(job, 'init', action.asWatcherInit());

			executeWatcher(job);
		}
	}
}
