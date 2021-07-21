#!/usr/bin/env node
'use strict';

type WorkerType = {
	init?: () => Promise<void>;
	work: () => void;
};
export default WorkerType;
