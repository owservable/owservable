'use strict';

import {isFunction} from 'lodash';

import WorkerType from '../../_types/worker.type';

const executeWorker = (obj: WorkerType) => {
	const {init, work} = obj;
	if (isFunction(init)) init().then(() => work?.());
	else work?.();
};
export default executeWorker;
