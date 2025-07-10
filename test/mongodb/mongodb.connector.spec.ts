'use strict';

import MongoDBConnector from '../../src/mongodb/mongodb.connector';

describe('mongodb.connector.ts tests', () => {
	it('MongoDBConnector exists', () => {
		expect(MongoDBConnector).toBeDefined();
		expect(typeof MongoDBConnector).toBe('function');
		expect(MongoDBConnector.init).toBeDefined();
		expect(typeof MongoDBConnector.init).toBe('function');
	});

	it.todo('should be implemented');
});
