'use strict';

import {expect} from 'chai';
import rewire = require('rewire');

import observableDatabase from '../../../src/mongodb/functions/observable.database';

const observableDatabaseModule = rewire('../../../src/mongodb/functions/observable.database');
const ObservableDatabase = observableDatabaseModule.__get__('ObservableDatabase');

// TODO: https://www.chaijs.com/plugins/chai-rxjs/

describe('owservable.database.ts tests', () => {
	it('observableDatabase exists', () => {
		expect(observableDatabase).to.be.an('function');
		expect(ObservableDatabase).to.be.an('function');
		expect(ObservableDatabase.init).to.be.an('function');
	});

	it('should be implemented');
});
