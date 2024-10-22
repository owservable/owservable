'use strict';

type WatcherType = {
	init?: () => Promise<void>;
	watch: () => Promise<void>;
	waitForInit?: boolean;
};
export default WatcherType;
