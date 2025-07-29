'use strict';

import {listSubfoldersByName} from '@owservable/folders';

import executeOnFilesRecursively from './execute.on.files.recursively';

const executeProcessesInFolder = (root: string, folderName: string, execute: (obj: any) => void): void => {
	const folders: string[] = listSubfoldersByName(root, folderName);
	folders.forEach((folder: string): void => executeOnFilesRecursively(folder, execute));
};

export default executeProcessesInFolder;
