#!/usr/bin/env node
'use strict';

import {toLower, replace, join, split} from 'lodash';

const cleanRelativePath = (rootFolder: string, absoluteFilePath: string, ext: '.ts' | '.js'): string => {
	let relativeFilePath = toLower(absoluteFilePath) + '/';
	relativeFilePath = replace(relativeFilePath, toLower(rootFolder), '');
	relativeFilePath = replace(relativeFilePath, toLower(ext), '');
	relativeFilePath = replace(relativeFilePath, 'root', '');
	relativeFilePath = join(split(relativeFilePath, '\\'), '/');
	relativeFilePath = join(split(relativeFilePath, '//'), '/');
	return relativeFilePath;
};
export default cleanRelativePath;
