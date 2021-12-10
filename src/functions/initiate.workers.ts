'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {each, filter, isFunction} from 'lodash';

import WorkerType from '../_types/worker.type';
import getSubfolderPathsByFolderName from './get.subfolder.paths.by.folder.name';

const _initiateWorkers = (folder: string): void => {
	const subfolderNames = fs.readdirSync(folder);
	const files = filter(subfolderNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	each(files, (file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const worker: WorkerType = require(absoluteFilePath).default;

		const {init, work} = worker;
		if (isFunction(init)) init().then(() => work?.());
		else work?.();
	});

	const folders = filter(subfolderNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	each(folders, (sub: string) => _initiateWorkers(path.join(folder, sub)));
};

const initiateWorkers = (root: string, name: string = 'workers'): void => {
	const folders: string[] = getSubfolderPathsByFolderName(root, name);
	each(folders, _initiateWorkers);
};
export default initiateWorkers;
