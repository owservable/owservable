'use strict';

import {Schema} from 'mongoose';

const addIndexToAttributes = (schema: Schema, attributes: string[], index: 1 | -1): void => {
	attributes.forEach((attribute: string): void => {
		const ind: any = {};
		ind[attribute] = index;
		schema.index(ind);
	});
};

export default addIndexToAttributes;
