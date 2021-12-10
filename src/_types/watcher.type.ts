'use strict';

type WatcherType = {
	init?: () => Promise<void>;
	watch: () => void;
};
export default WatcherType;
