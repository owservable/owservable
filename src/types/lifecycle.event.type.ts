'use strict';

type LifecycleEvent = {
	type: 'live' | 'error' | 'close' | 'end';
	collection: string;
	timestamp: Date;
	error?: any;
};

export default LifecycleEvent;
