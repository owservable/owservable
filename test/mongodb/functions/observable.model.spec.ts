'use strict';

import {expect} from 'chai';
import rewire = require('rewire');

import observableModel from '../../../src/mongodb/functions/observable.model';

const observableModelModule = rewire('../../../src/mongodb/functions/observable.model');
const ObservableModel = observableModelModule.__get__('ObservableModel');
const ObservableModelsMap = observableModelModule.__get__('ObservableModelsMap');

// TODO: https://www.chaijs.com/plugins/chai-rxjs/

describe('owservable.model.ts tests', () => {
	it('observableModel exists', () => {
		expect(observableModel).to.be.an('function');
		expect(ObservableModel).to.be.an('function');
		expect(ObservableModelsMap).to.be.an('function');
		expect(ObservableModelsMap.get).to.be.an('function');
		expect(ObservableModelsMap.init).to.be.an('function');
	});
});