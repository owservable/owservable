'use strict';

type WorkerType = {
	init?: () => Promise<void>;
	work: () => Promise<void>;
};
export default WorkerType;
