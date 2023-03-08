'use strict';

import deprecated from 'deprecated-decorator';

import {Schema} from 'mongoose';

import addUpAndDownIndicesToAttributes from './add.up.and.down.indices.to.attributes';

/**
 * @deprecated Please use {@link addUpAndDownIndicesToAttributes}, instead.
 */
// @ts-ignore
@deprecated('addUpAndDownIndicesToAttributes', '0.8.38')
const addBothIndicesToAttributes = (schema: Schema, attributes: string[]): void => {
	console.warn('\n    - Calling deprecated function "addUpAndDownIndicesToAttributes"! Please use "addUpAndDownIndicesToAttributes", instead!\n');
	addUpAndDownIndicesToAttributes(schema, attributes);

};
export default addBothIndicesToAttributes;
