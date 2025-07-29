'use strict';

import * as cron from 'node-cron';

import CronJobType from '../../types/cronjob.type';

const executeCronjob = (obj: CronJobType) => {
	const {schedule, job, options, init} = obj;
	if (typeof init === 'function') init().then(() => cron.schedule(schedule, job, options));
	else cron.schedule(schedule, job, options);
};

export default executeCronjob;
