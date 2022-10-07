'use strict';

import {expect} from 'chai';
import initiateProcesses from '../../src/functions/initiate.processes';

describe('initiateProcesses.workers.ts tests', () => {
	it('initiateProcesses exists', () => {
		expect(initiateProcesses).to.be.a('function');
	});
});