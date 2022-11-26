'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {each, filter} from 'lodash';

const executeOnFilesRecursively = (folder: string, execute: Function): void => {
	const children = fs.readdirSync(folder);
	const files = filter(children, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	each(files, (file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const obj: any = require(absoluteFilePath).default;
		execute(obj);
	});

	const folders = filter(children, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	each(folders, (sub: string) => executeOnFilesRecursively(path.join(folder, sub), execute));
};
export default executeOnFilesRecursively;
