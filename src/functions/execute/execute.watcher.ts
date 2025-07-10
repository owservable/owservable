'use strict';

import {isFunction} from 'lodash';

import WatcherType from '../../types/watcher.type';

const executeWatcher = (obj: WatcherType): void => {
	const {init, watch, waitForInit = false} = obj;

	if (true !== waitForInit) {
		if (isFunction(init)) init?.().then((): null => null);
		watch?.();
		return;
	}

	if (isFunction(init)) init().then(() => watch?.());
	else watch?.();
};
export default executeWatcher;
