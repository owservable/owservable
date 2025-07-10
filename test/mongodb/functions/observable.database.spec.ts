'use strict';

import observableDatabase from '../../../src/mongodb/functions/observable.database';

// TODO: https://www.chaijs.com/plugins/chai-rxjs/

describe('owservable.database.ts tests', () => {
	it('observableDatabase exists', () => {
		expect(observableDatabase).toBeDefined();
		expect(typeof observableDatabase).toBe('function');
	});

	it.todo('should be implemented');
});
