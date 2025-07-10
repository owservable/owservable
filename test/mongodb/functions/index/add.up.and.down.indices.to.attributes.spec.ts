'use strict';

import {Schema} from 'mongoose';
import addUpAndDownIndicesToAttributes from '../../../../src/mongodb/functions/index/add.up.and.down.indices.to.attributes';
import addUpIndicesToAttributes from '../../../../src/mongodb/functions/index/add.up.indices.to.attributes';
import addDownIndicesToAttributes from '../../../../src/mongodb/functions/index/add.down.indices.to.attributes';

// Mock the dependencies
jest.mock('../../../../src/mongodb/functions/index/add.up.indices.to.attributes');
jest.mock('../../../../src/mongodb/functions/index/add.down.indices.to.attributes');

const mockAddUpIndicesToAttributes = addUpIndicesToAttributes as jest.MockedFunction<typeof addUpIndicesToAttributes>;
const mockAddDownIndicesToAttributes = addDownIndicesToAttributes as jest.MockedFunction<typeof addDownIndicesToAttributes>;

describe('add.up.and.down.indices.to.attributes tests', () => {
	let mockSchema: Schema;

	beforeEach(() => {
		mockSchema = {} as Schema;
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(addUpAndDownIndicesToAttributes).toBeDefined();
		expect(typeof addUpAndDownIndicesToAttributes).toBe('function');
	});

	it('should call both up and down index functions', () => {
		const attributes = ['name', 'email'];

		addUpAndDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledTimes(1);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledTimes(1);
		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
	});

	it('should handle single attribute', () => {
		const attributes = ['status'];

		addUpAndDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
	});

	it('should handle multiple attributes', () => {
		const attributes = ['name', 'email', 'createdAt', 'status'];

		addUpAndDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
	});

	it('should handle empty attributes array', () => {
		const attributes: string[] = [];

		addUpAndDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
	});

	it('should handle nested attributes', () => {
		const attributes = ['user.profile.name', 'settings.theme'];

		addUpAndDownIndicesToAttributes(mockSchema, attributes);

		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledWith(mockSchema, attributes);
	});

	it('should pass different schemas correctly', () => {
		const schema1 = {} as Schema;
		const schema2 = {} as Schema;
		const attributes = ['test'];

		addUpAndDownIndicesToAttributes(schema1, attributes);
		addUpAndDownIndicesToAttributes(schema2, attributes);

		expect(mockAddUpIndicesToAttributes).toHaveBeenCalledTimes(2);
		expect(mockAddDownIndicesToAttributes).toHaveBeenCalledTimes(2);
		expect(mockAddUpIndicesToAttributes).toHaveBeenNthCalledWith(1, schema1, attributes);
		expect(mockAddUpIndicesToAttributes).toHaveBeenNthCalledWith(2, schema2, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenNthCalledWith(1, schema1, attributes);
		expect(mockAddDownIndicesToAttributes).toHaveBeenNthCalledWith(2, schema2, attributes);
	});

	it('should call functions in correct order', () => {
		const attributes = ['name'];
		const callOrder: string[] = [];

		mockAddUpIndicesToAttributes.mockImplementation(() => {
			callOrder.push('up');
		});

		mockAddDownIndicesToAttributes.mockImplementation(() => {
			callOrder.push('down');
		});

		addUpAndDownIndicesToAttributes(mockSchema, attributes);

		expect(callOrder).toEqual(['up', 'down']);
	});
});
