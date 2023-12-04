'use strict';

type SubscriptionMethodsType = {
	next: (value: any) => void | Promise<void>;
	error?: (err: any) => void;
	complete?: () => void;
};
export default SubscriptionMethodsType;
