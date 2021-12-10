'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {each, filter, isFunction} from 'lodash';

import WatcherType from '../_types/watcher.type';
import getSubfolderPathsByFolderName from './get.subfolder.paths.by.folder.name';

const _initiateWatchers = (folder: string): void => {
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
	each(folders, (sub: string) => _initiateWatchers(path.join(folder, sub)));
};

const initiateWatchers = (root: string, name: string = 'watchers'): void => {
	const folders: string[] = getSubfolderPathsByFolderName(root, name);
	each(folders, _initiateWatchers);
};
export default initiateWatchers;
