#!/usr/bin/env node
'use strict';

import {each, includes, map, split} from 'lodash';
import RoutesMap from '../routes.map';

const processFastifyBlipp = (blipp: string): void => {
	console.log(blipp);
	if (!includes(blipp, 'Routes:')) {
		let routes = split(blipp, '\n');
		routes = map(routes, (r) => r.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''));
		each(routes, (r) => {
			const parts = split(r, '\t');
			RoutesMap.add(parts[0], parts[1]);
		});
	}
};
export default processFastifyBlipp;
