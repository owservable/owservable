'use strict';

type StoreSubscriptionConfigType = {
	query: any;
	sort?: any;
	fields?: any;
	skip?: number;
	page?: number;
	pageSize?: number;
	strict: false;
	incremental: false;
};
export default StoreSubscriptionConfigType;
