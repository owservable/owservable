'use strict';

type CronJobType = {
	schedule: string;
	init?: () => Promise<void>;
	job: () => Promise<void>;
	options?: any;
};
export default CronJobType;
