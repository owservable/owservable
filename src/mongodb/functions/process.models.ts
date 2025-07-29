'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {endsWith, find, isString} from 'lodash';
import {listSubfoldersByName, ItemStat} from '@owservable/folders';

import CollectionsModelsMap from '../collections.models.map';

const _processFile = (folder: string, file: string): void => {
	const fullPath: string = path.join(folder, file);
	const model: any = require(fullPath).default;
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

	const subfolderNames: string[] = fs.readdirSync(folder);

	// PERFORMANCE: Single lstat call per item instead of two
	const itemStats: ItemStat[] = subfolderNames.map((fileName: string): ItemStat => {
		const fullPath: string = path.join(folder, fileName);
		const stat: fs.Stats = fs.lstatSync(fullPath);
		return {
			name: fileName,
			fullPath,
			isDirectory: stat.isDirectory()
		};
	});

	// Separate files and folders using cached stat results
	const files: ItemStat[] = itemStats.filter((item: ItemStat): boolean => !item.isDirectory);
	const folders: ItemStat[] = itemStats.filter((item: ItemStat): boolean => item.isDirectory);

	// Process files using native forEach
	files.forEach((file: ItemStat): void => {
		const ext: string = path.extname(file.name);
		if (ext !== '.ts' && ext !== '.js') return;
		_processFile(folder, file.name);
	});

	// Process subfolders recursively using native forEach
	folders.forEach((subFolder: ItemStat): void => _processModels(subFolder.fullPath, exclude));
};

const processModels = (root: string, name: string = 'models', exclude?: string | string[]): void => {
	const folders: string[] = listSubfoldersByName(root, name);
	folders.forEach((folder: string): void => _processModels(folder, exclude));
};

export default processModels;
