'use strict';

import {isFunction} from 'lodash';

import WorkerType from '../_types/worker.type';
import initiateProcesses from './initiate.processes';

const _execute = (obj: WorkerType) => {
	const {init, work} = obj;
	if (isFunction(init)) init().then(() => work?.());
	else work?.();
};

const initiateWorkers = (root: string, name: string = 'workers'): void => {
	initiateProcesses(root, name, _execute);
};
export default initiateWorkers;
