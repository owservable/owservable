'use strict';

import * as _ from 'lodash';

const convertToLeaves = (data: any) => {
	const result: any = {};
	const recurse = (cur: any, prop: any) => {
		if (Object(cur) !== cur) {
			result[prop] = cur;
			//
		} else if (_.isArray(cur)) {
			if (_.isEmpty(cur)) result[prop] = [];
			else {
				for (let i = 0; i < cur.length; i++) {
					recurse(cur[i], prop ? prop + '.' + i : '' + i);
				}
			}
			//
		} else {
			if (_.isEmpty(_.keys(cur))) result[prop] = {};
			else _.each(cur, (value, key) => recurse(value, prop ? prop + '.' + key : key));
		}
	};
	recurse(data, '');
	return result;
};
export default convertToLeaves;
