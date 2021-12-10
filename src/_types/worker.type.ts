'use strict';

type WorkerType = {
	init?: () => Promise<void>;
	work: () => void;
};
export default WorkerType;
