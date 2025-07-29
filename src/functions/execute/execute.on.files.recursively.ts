'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {ItemStat} from '@owservable/folders';

const executeOnFilesRecursively = (folder: string, execute: Function): void => {
	const children: string[] = fs.readdirSync(folder);

	// PERFORMANCE: Single lstat call per item instead of two
	const itemStats: ItemStat[] = children.map((name: string): ItemStat => {
		const fullPath: string = path.join(folder, name);
		const stat: fs.Stats = fs.lstatSync(fullPath);
		return {
			name,
			fullPath,
			isDirectory: stat.isDirectory()
		};
	});

	// Separate files and folders using cached stat results
	const files: ItemStat[] = itemStats.filter((item: ItemStat): boolean => !item.isDirectory);
	const folders: ItemStat[] = itemStats.filter((item: ItemStat): boolean => item.isDirectory);

	// Process files using native forEach
	files.forEach((file: ItemStat): void => {
		const obj: any = require(file.fullPath).default;
		execute(obj);
	});

	// Process subfolders recursively using native forEach
	folders.forEach((subFolder: ItemStat): void => executeOnFilesRecursively(subFolder.fullPath, execute));
};

export default executeOnFilesRecursively;
