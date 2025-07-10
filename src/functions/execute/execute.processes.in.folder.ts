'use strict';

import {each} from 'lodash';
import {listSubfoldersByName} from '@owservable/folders';

import executeOnFilesRecursively from './execute.on.files.recursively';

const executeProcessesInFolder = (root: string, folderName: string, execute: Function): void => {
	const folders: string[] = listSubfoldersByName(root, folderName);
	each(folders, (folder: string) => executeOnFilesRecursively(folder, execute));
};
export default executeProcessesInFolder;
