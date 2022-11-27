'use strict';

import {Schema} from 'mongoose';

import addUpIndicesToAttributes from './add.up.indices.to.attributes';
import addDownIndicesToAttributes from './add.down.indices.to.attributes';

const addBothIndicesToAttributes = (schema: Schema, attributes: string[]): void => {
	addUpIndicesToAttributes(schema, attributes);
	addDownIndicesToAttributes(schema, attributes);
};
export default addBothIndicesToAttributes;
