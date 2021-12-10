'use strict';

type ObserverType = {
	init?: () => Promise<void>;
	observe: () => void;
};
export default ObserverType;
