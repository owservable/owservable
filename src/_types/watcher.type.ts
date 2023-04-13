'use strict';

type WatcherType = {
	init?: () => Promise<void>;
	watch: () => void;
	waitForInit?: boolean;
};
export default WatcherType;
