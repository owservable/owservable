import {expect} from 'chai';
import initiateWorkers from '../../src/functions/initiate.workers';

describe('initiate.workers.ts tests', () => {
	it('initiateWorkers exists', () => {
		expect(initiateWorkers).to.be.a('function');
	});
});
