'use strict';

import WorkerType from '../../types/worker.type';

const executeWorker = (obj: WorkerType) => {
	const {init, work} = obj;
	if (typeof init === 'function') init().then(() => work?.());
	else work?.();
};

export default executeWorker;
