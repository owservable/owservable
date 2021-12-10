'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {concat, each, filter} from 'lodash';

const getSubfolderPathsByFolderName = (root: string, name: string): string[] => {
	let folders: string[] = [];

	const subfolderNames = fs.readdirSync(root);
	const subfolders = filter(subfolderNames, (subfolderName: string) => fs.lstatSync(path.join(root, subfolderName)).isDirectory());

	each(subfolders, (subfolder) => {
		const fullPath = path.join(root, subfolder);
		if (name === subfolder) folders.push(fullPath);
		else folders = concat(folders, getSubfolderPathsByFolderName(fullPath, name));
	});

	return folders;
};
export default getSubfolderPathsByFolderName;
