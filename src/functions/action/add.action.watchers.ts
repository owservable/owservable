'use strict';

import {ActionAsWatcherInterface} from '@owservable/actions';
import {listSubfoldersFilesByFolderName} from '@owservable/folders';

import WatcherType from '../../types/watcher.type';
import executeWatcher from '../execute/execute.watcher';

export default function addActionWatchers(root: string, folderName: string): void {
	const actionPaths: string[] = listSubfoldersFilesByFolderName(root, folderName);

	for (const actionPath of actionPaths) {
		console.log('[@owservable] -> Initializing watcher action', actionPath);
		// tslint:disable-next-line:callable-types
		const ActionClass: new () => ActionAsWatcherInterface = require(actionPath).default;
		const action: ActionAsWatcherInterface = new ActionClass();

		if (typeof action.asWatcher === 'function') {
			const job: WatcherType = {
				...(action.asWatcherInit && {init: action.asWatcherInit}),
				watch: action.asWatcher
			};
			if (typeof action.asWatcherInit === 'function') job.init = action.asWatcherInit;

			executeWatcher(job);
		}
	}
}
