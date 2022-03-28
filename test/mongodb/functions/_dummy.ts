'use strict';

import {model, Schema} from 'mongoose';

const DummySchema = new Schema({dummy: {type: String}});
const Dummy = model<any>('Dummy', DummySchema, 'dummy');
export default Dummy;
