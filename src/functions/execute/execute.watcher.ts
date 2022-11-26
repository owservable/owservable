'use strict';

import {isFunction} from 'lodash';

import WatcherType from '../../_types/watcher.type';

const executeWatcher = (obj: WatcherType) => {
	const {init, watch} = obj;
	if (isFunction(init)) init().then(() => watch?.());
	else watch?.();
};
export default executeWatcher;
