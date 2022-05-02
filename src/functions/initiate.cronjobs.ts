'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';

import {each, filter, isFunction} from 'lodash';

import CronJobType from '../_types/cronjob.type';
import getSubfolderPathsByFolderName from './get.subfolder.paths.by.folder.name';

const _initiateCronjobs = (folder: string): void => {
	const subfolderNames = fs.readdirSync(folder);
	const files = filter(subfolderNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	each(files, (file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const cronjob: CronJobType = require(absoluteFilePath).default;

		const {schedule, job, options, init} = cronjob;
		if (isFunction(init)) init().then(() => cron.schedule(schedule, job, options));
		else cron.schedule(schedule, job, options);
	});

	const folders = filter(subfolderNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	each(folders, (sub: string) => _initiateCronjobs(path.join(folder, sub)));
};

const initiateCronjobs = (root: string, name: string = 'cronjobs'): void => {
	const folders: string[] = getSubfolderPathsByFolderName(root, name);
	each(folders, _initiateCronjobs);
};
export default initiateCronjobs;
