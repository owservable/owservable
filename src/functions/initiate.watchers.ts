'use strict';

import {isFunction} from 'lodash';

import WatcherType from '../_types/watcher.type';
import initiateProcesses from './initiate.processes';

const _execute = (obj: WatcherType) => {
	const {init, watch} = obj;
	if (isFunction(init)) init().then(() => watch?.());
	else watch?.();
};

const initiateWatchers = (root: string, name: string = 'watchers'): void => {
	initiateProcesses(root, name, _execute);
};
export default initiateWatchers;
