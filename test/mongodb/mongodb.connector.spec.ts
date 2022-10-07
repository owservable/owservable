'use strict';

import {expect} from 'chai';
import MongoDBConnector from '../../src/mongodb/mongodb.connector';

describe('mongodb.connector.ts tests', () => {
	it('MongoDBConnector exists', () => {
		expect(MongoDBConnector).to.be.an('function');
		expect(MongoDBConnector.init).to.be.an('function');
	});
});