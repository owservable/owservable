'use strict';

type CronJobType = {
	schedule: string;
	init?: () => Promise<void>;
	job: () => void | Promise<void>;
	options?: any;
};
export default CronJobType;
