'use strict';

import * as cron from 'node-cron';

import {isFunction} from 'lodash';

import CronJobType from '../../_types/cronjob.type';

const executeCronjob = (obj: CronJobType) => {
	const {schedule, job, options, init} = obj;
	if (isFunction(init)) init().then(() => cron.schedule(schedule, job, options));
	else cron.schedule(schedule, job, options);
};
export default executeCronjob;
