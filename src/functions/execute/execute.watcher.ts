'use strict';

import WatcherType from '../../types/watcher.type';

const executeWatcher = (obj: WatcherType): void => {
	const {init, watch, waitForInit = false} = obj;

	if (true !== waitForInit) {
		if (typeof init === 'function') init?.().then((): null => null);
		watch?.();
		return;
	}

	if (typeof init === 'function') init().then(() => watch?.());
	else watch?.();
};

export default executeWatcher;
