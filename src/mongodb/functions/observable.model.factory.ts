'use strict';

import {Model} from 'mongoose';

import ObservableModel from './observable.model';
import ObservableModelsMap from './observable.models.map';

const observableModel = (model: Model<any>): ObservableModel => ObservableModelsMap.get(model);
export default observableModel;
