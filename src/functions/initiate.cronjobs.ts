'use strict';

import * as cron from 'node-cron';

import {isFunction} from 'lodash';

import CronJobType from '../_types/cronjob.type';
import initiateProcesses from './initiate.processes';

const _execute = (obj: CronJobType) => {
	const {schedule, job, options, init} = obj;
	if (isFunction(init)) init().then(() => cron.schedule(schedule, job, options));
	else cron.schedule(schedule, job, options);
};

const initiateCronjobs = (root: string, name: string = 'cronjobs'): void => {
	initiateProcesses(root, name, _execute);
};
export default initiateCronjobs;
