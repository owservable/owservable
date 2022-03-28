import {expect} from 'chai';
import DataMiddlewareMap from '../../src/middleware/data.middleware.map';

describe('data.middleware.map.ts tests', () => {
	it('DataMiddlewareMap exists', () => {
		expect(DataMiddlewareMap).to.be.an('function');
	});
	it('DataMiddlewareMap functionality', () => {
		let keys = DataMiddlewareMap.keys();
		expect(keys).to.be.empty;
		expect(DataMiddlewareMap.hasMiddleware('count', 'users')).to.be.equal(false);
		expect(DataMiddlewareMap.getMiddleware('count', 'users')).to.be.undefined;

		const processor = () => console.log('processor');

		DataMiddlewareMap.addMiddleware('count', 'users', processor);
		keys = DataMiddlewareMap.keys();
		expect(keys).to.have.length(1);
		expect(DataMiddlewareMap.hasMiddleware('count', 'users')).to.be.equal(true);
		expect(DataMiddlewareMap.getMiddleware('count', 'users')).to.not.be.undefined;
		expect(DataMiddlewareMap.getMiddleware('count', 'users')).to.be.equal(processor);
	});
});
