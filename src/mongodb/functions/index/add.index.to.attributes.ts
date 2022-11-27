'use strict';

import {Schema} from 'mongoose';
import {each, set} from 'lodash';

const addIndexToAttributes = (schema: Schema, attributes: string[], index: 1 | -1): void => {
	each(attributes, (attribute: string) => {
		const ind = {};
		set(ind, attribute, index);
		schema.index(ind);
	});
};
export default addIndexToAttributes;
