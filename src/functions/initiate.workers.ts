'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {filter, isFunction} from 'lodash';

import WorkerType from '../_types/worker.type';

const _asyncedStart = (worker: WorkerType): void => {
	const {init, work} = worker;
	if (isFunction(init)) init().then(() => work?.());
	else work?.();
};

const initiateWorkers = (folder: string): void => {
	const fileNames = fs.readdirSync(folder);
	const files = filter(fileNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	files.forEach((file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const worker: WorkerType = require(absoluteFilePath).default;
		setTimeout(() => _asyncedStart(worker));
	});

	const folders = filter(fileNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	folders.forEach((sub: string) => initiateWorkers(path.join(folder, sub)));
};
export default initiateWorkers;
