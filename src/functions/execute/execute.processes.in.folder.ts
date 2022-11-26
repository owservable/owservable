'use strict';

import {each} from 'lodash';
import {listSubfoldersByName} from '@owservable/folders';

import executeOnFilesRecursively from './execute.on.files.recursively';

const executeProcessesInFolder = (root: string, folder: string, execute: Function): void => {
	const folders: string[] = listSubfoldersByName(root, folder);
	each(folders, (folder: string) => executeOnFilesRecursively(folder, execute));
};
export default executeProcessesInFolder;
