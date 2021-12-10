'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {each, filter, isFunction} from 'lodash';

import WatcherType from '../_types/watcher.type';
import getSubfolderPathsByFolderName from './get.subfolder.paths.by.folder.name';

const _initiateObservers = (folder: string): void => {
	const subfolderNames = fs.readdirSync(folder);
	const files = filter(subfolderNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	each(files, (file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const watcher: WatcherType = require(absoluteFilePath).default;

		const {init, watch} = watcher;
		if (isFunction(init)) init().then(() => watch?.());
		else watch?.();
	});

	const folders = filter(subfolderNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	each(folders, (sub: string) => _initiateObservers(path.join(folder, sub)));
};

const initiateObservers = (root: string, name: string = 'observers'): void => {
	const folders: string[] = getSubfolderPathsByFolderName(root, name);
	each(folders, _initiateObservers);
};
export default initiateObservers;
