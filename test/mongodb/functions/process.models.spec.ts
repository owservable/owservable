'use strict';

import {expect} from 'chai';
import rewire = require('rewire');

import Dummy from './_dummy';
import processModels from '../../../src/mongodb/functions/process.models';
import CollectionsModelsMap from '../../../src/mongodb/collections.models.map';

const processModelsModule = rewire('../../../src/mongodb/functions/process.models');
const _processFile = processModelsModule.__get__('_processFile');
const _isExcluded = processModelsModule.__get__('_isExcluded');
const _processModels = processModelsModule.__get__('_processModels');

describe('process.models.ts tests', () => {
	it('processModels exists', () => {
		expect(processModels).to.be.an('function');
		expect(_processFile).to.be.an('function');
		expect(_isExcluded).to.be.an('function');
		expect(_processModels).to.be.an('function');
	});
	it('_processFile', () => {
		expect(() => _processFile('dummy', 'test')).to.throw;
		_processFile(__dirname, '_dummy.ts');
		expect(CollectionsModelsMap.keys()).to.have.length(1);
		expect(CollectionsModelsMap.values()).to.have.length(1);
		expect(CollectionsModelsMap.getModelByCollection('dummy')).to.be.equal(Dummy);
	});
	it('_isExcluded', () => {
		expect(_isExcluded('test')).to.be.equal(false);
		expect(_isExcluded('dummy/test', 'test')).to.be.equal(true);
		expect(_isExcluded('dummy/test', ['test'])).to.be.equal(true);
	});

	it('should be implemented');
});
