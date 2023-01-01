'use strict';

type StoreSubscriptionConfigType = {
	subscriptionId?: string; // randomUUID
	query: any;
	sort?: any;
	fields?: any;
	skip?: number;
	page?: number;
	pageSize?: number;
	strict: false;
	incremental: false;

	populates?: any;
	virtuals?: any;
	delay?: number;
};
export default StoreSubscriptionConfigType;
