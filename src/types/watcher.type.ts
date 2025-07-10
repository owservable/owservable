'use strict';

type WatcherType = {
	init?: () => Promise<void>;
	watch: () => void | Promise<void>;
	waitForInit?: boolean;
};
export default WatcherType;
