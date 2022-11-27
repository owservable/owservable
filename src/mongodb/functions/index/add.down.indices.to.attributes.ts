'use strict';

import {Schema} from 'mongoose';

import addIndexToAttributes from './add.index.to.attributes';

const addDownIndicesToAttributes = (schema: Schema, attributes: string[]): void => addIndexToAttributes(schema, attributes, -1);
export default addDownIndicesToAttributes;
