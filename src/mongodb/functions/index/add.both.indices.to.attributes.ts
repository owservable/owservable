'use strict';

import {Schema} from 'mongoose';

import addUpAndDownIndicesToAttributes from './add.up.and.down.indices.to.attributes';

/**
 * @deprecated Please use {@link addUpAndDownIndicesToAttributes}, instead.
 */
const addBothIndicesToAttributes = (schema: Schema, attributes: string[]): void => addUpAndDownIndicesToAttributes(schema, attributes);
export default addBothIndicesToAttributes;
