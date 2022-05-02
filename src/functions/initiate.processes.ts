'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {each, filter} from 'lodash';

import getSubfolderPathsByFolderName from './get.subfolder.paths.by.folder.name';

const _initiate = (folder: string, execute: Function): void => {
	const subfolderNames = fs.readdirSync(folder);
	const files = filter(subfolderNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	each(files, (file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const obj: any = require(absoluteFilePath).default;
		execute(obj);
	});

	const folders = filter(subfolderNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	each(folders, (sub: string) => _initiate(path.join(folder, sub), execute));
};

const initiateProcesses = (root: string, name: string, execute: Function): void => {
	const folders: string[] = getSubfolderPathsByFolderName(root, name);
	each(folders, (folder: string) => _initiate(folder, execute));
};
export default initiateProcesses;
