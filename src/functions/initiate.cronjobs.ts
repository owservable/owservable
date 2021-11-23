'use strict';

import * as fs from 'fs';
import * as path from 'path';

import {filter, isFunction} from 'lodash';
import * as cron from 'node-cron';

import CronJobType from '../_types/cronjob.type';

const _asyncedStart = (cronjob: CronJobType): void => {
	const {schedule, job, options, init} = cronjob;
	if (isFunction(init)) init().then(() => cron.schedule(schedule, job, options));
	else cron.schedule(schedule, job, options);
};

const initiateCronjobs = (folder: string): void => {
	const fileNames = fs.readdirSync(folder);
	const files = filter(fileNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	files.forEach((file: string) => {
		const absoluteFilePath = path.join(folder, file);
		const cronjob: CronJobType = require(absoluteFilePath).default;
		setTimeout(() => _asyncedStart(cronjob));
	});

	const folders = filter(fileNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	folders.forEach((sub: string) => initiateCronjobs(path.join(folder, sub)));
};
export default initiateCronjobs;
