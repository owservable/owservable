'use strict';

type WorkerType = {
	init?: () => Promise<void>;
	work: () => void | Promise<void>;
};
export default WorkerType;
