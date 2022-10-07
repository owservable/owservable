'use strict';

import {expect} from 'chai';
import initiateWatchers from '../../src/functions/initiate.watchers';

describe('initiate.watchers.ts tests', () => {
	it('initiateWatchers exists', () => {
		expect(initiateWatchers).to.be.a('function');
	});
});