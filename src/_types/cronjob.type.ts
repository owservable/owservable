'use strict';

type CronJobType = {
	schedule: string;
	job: () => void;
	options?: any;
	init?: () => Promise<void>;
};
export default CronJobType;
