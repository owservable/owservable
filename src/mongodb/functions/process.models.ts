'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {endsWith, find, isString, filter} from 'lodash';

import CollectionsModelsMap from '../collections.models.map';

const _processFile = (folder: string, file: string): void => {
	const fullPath = path.join(folder, file);
	const model = require(fullPath).default;
	if (!model) console.log(' - ERROR:', `Model not found in ${folder}/${file}`);
	else if (!model?.collection) console.log(' - ERROR:', `Model collection not defined in ${folder}/${file}`);
	CollectionsModelsMap.addCollectionToModelMapping(model);
};

const _isExcluded = (folder: string, exclude: string | string[]): boolean => {
	if (!exclude) return false;
	return isString(exclude) //
		? endsWith(folder, exclude) //
		: !!find(exclude, (e: string) => endsWith(folder, e));
};

const processModels = (folder: string, exclude?: string | string[]): void => {
	if (_isExcluded(folder, exclude)) return;

	const fileNames = fs.readdirSync(folder);
	const files = filter(fileNames, (fileName: string) => !fs.lstatSync(path.join(folder, fileName)).isDirectory());
	files.forEach((file: string) => {
		const ext = path.extname(file);
		if (ext !== '.ts' && ext !== '.js') return;
		_processFile(folder, file);
	});

	const folders = filter(fileNames, (fileName: string) => fs.lstatSync(path.join(folder, fileName)).isDirectory());
	folders.forEach((sub: string) => processModels(path.join(folder, sub), exclude));
};
export default processModels;
