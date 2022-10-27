'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {each, endsWith, filter, find, isString} from 'lodash';
import {listSubfoldersByName} from '@owservable/list-subfolders-by-name';

import CollectionsModelsMap from '../collections.models.map';

const _processFile = (folder: string, file: string): void => {
	const fullPath = path.join(folder, file);
	const model = require(fullPath).default;
	if (!model) throw new Error(`Model not found in ${folder}/${file}`);
	CollectionsModelsMap.addCollectionToModelMapping(model);
};

const _isExcluded = (folder: string, exclude: string | string[]): boolean => {
	if (!exclude) return false;
	return isString(exclude) //
		? endsWith(folder, exclude) //
		: !!find(exclude, (e: string) => endsWith(folder, e));
};

const _processModels = (folder: string, exclude?: string | string[]): void => {
	if (_isExcluded(folder, exclude)) return;

	const subfolderNames = fs.readdirSync(folder);
	const files = filter(subfolderNames, (fileName: string) => !fs.lstatSync(path.join(folder, fileName)).isDirectory());
	each(files, (file: string) => {
		const ext = path.extname(file);
		if (ext !== '.ts' && ext !== '.js') return;
		_processFile(folder, file);
	});

	const folders = filter(subfolderNames, (fileName: string) => fs.lstatSync(path.join(folder, fileName)).isDirectory());
	each(folders, (sub: string) => _processModels(path.join(folder, sub), exclude));
};

const processModels = (root: string, name: string = 'models', exclude?: string | string[]): void => {
	const folders: string[] = listSubfoldersByName(root, name);
	each(folders, (folder: string) => _processModels(folder, exclude));
};
export default processModels;
