'use strict';

import {Model} from 'mongoose';
import {Subject} from 'rxjs';

import ObservableModelsMap from './observable.models.map';

const observableModel = (model: Model<any>): Subject<any> => ObservableModelsMap.get(model);
export default observableModel;
