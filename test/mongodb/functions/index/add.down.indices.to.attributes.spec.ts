'use strict';

import {Schema} from 'mongoose';
import addDownIndicesToAttributes from '../../../../src/mongodb/functions/index/add.down.indices.to.attributes';
import addIndexToAttributes from '../../../../src/mongodb/functions/index/add.index.to.attributes';

// Mock the dependencies
jest.mock('../../../../src/mongodb/functions/index/add.index.to.attributes');

const mockAddIndexToAttributes = addIndexToAttributes as jest.MockedFunction<typeof addIndexToAttributes>;

describe('add.down.indices.to.attributes tests', () => {
	let mockSchema: Schema;

	beforeEach(() => {
		mockSchema = {} as Schema;
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(addDownIndicesToAttributes).toBeDefined();
		expect(typeof addDownIndicesToAttributes).toBe('function');
	});

	it('should call addIndexToAttributes with descending index (-1)', () => {
		const attributes = ['name', 'email'];

		addDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddIndexToAttributes).toHaveBeenCalledTimes(1);
		expect(mockAddIndexToAttributes).toHaveBeenCalledWith(mockSchema, attributes, -1);
	});

	it('should handle single attribute', () => {
		const attributes = ['createdAt'];

		addDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddIndexToAttributes).toHaveBeenCalledWith(mockSchema, attributes, -1);
	});

	it('should handle multiple attributes', () => {
		const attributes = ['name', 'email', 'createdAt', 'status'];

		addDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddIndexToAttributes).toHaveBeenCalledWith(mockSchema, attributes, -1);
	});

	it('should handle empty attributes array', () => {
		const attributes: string[] = [];

		addDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddIndexToAttributes).toHaveBeenCalledWith(mockSchema, attributes, -1);
	});

	it('should handle nested attributes', () => {
		const attributes = ['user.profile.name', 'settings.theme'];

		addDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddIndexToAttributes).toHaveBeenCalledWith(mockSchema, attributes, -1);
	});

	it('should pass different schemas correctly', () => {
		const schema1 = {} as Schema;
		const schema2 = {} as Schema;
		const attributes = ['test'];

		addDownIndicesToAttributes(schema1, attributes);
		addDownIndicesToAttributes(schema2, attributes);

		expect(mockAddIndexToAttributes).toHaveBeenCalledTimes(2);
		expect(mockAddIndexToAttributes).toHaveBeenNthCalledWith(1, schema1, attributes, -1);
		expect(mockAddIndexToAttributes).toHaveBeenNthCalledWith(2, schema2, attributes, -1);
	});
});
