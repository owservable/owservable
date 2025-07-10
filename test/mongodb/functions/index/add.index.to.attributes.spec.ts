'use strict';

import {Schema} from 'mongoose';
import addIndexToAttributes from '../../../../src/mongodb/functions/index/add.index.to.attributes';

// Mock mongoose
jest.mock('mongoose');

describe('add.index.to.attributes tests', () => {
	let mockSchema: jest.Mocked<Schema>;

	beforeEach(() => {
		mockSchema = {
			index: jest.fn()
		} as any;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(addIndexToAttributes).toBeDefined();
		expect(typeof addIndexToAttributes).toBe('function');
	});

	it('should create ascending index for single attribute', () => {
		const attributes = ['name'];
		const index = 1;

		addIndexToAttributes(mockSchema, attributes, index);

		expect(mockSchema.index).toHaveBeenCalledTimes(1);
		expect(mockSchema.index).toHaveBeenCalledWith({name: 1});
	});

	it('should create descending index for single attribute', () => {
		const attributes = ['createdAt'];
		const index = -1;

		addIndexToAttributes(mockSchema, attributes, index);

		expect(mockSchema.index).toHaveBeenCalledTimes(1);
		expect(mockSchema.index).toHaveBeenCalledWith({createdAt: -1});
	});

	it('should create indices for multiple attributes', () => {
		const attributes = ['name', 'email', 'status'];
		const index = 1;

		addIndexToAttributes(mockSchema, attributes, index);

		expect(mockSchema.index).toHaveBeenCalledTimes(3);
		expect(mockSchema.index).toHaveBeenNthCalledWith(1, {name: 1});
		expect(mockSchema.index).toHaveBeenNthCalledWith(2, {email: 1});
		expect(mockSchema.index).toHaveBeenNthCalledWith(3, {status: 1});
	});

	it('should handle nested attributes', () => {
		const attributes = ['user.profile.name', 'settings.theme'];
		const index = 1;

		addIndexToAttributes(mockSchema, attributes, index);

		expect(mockSchema.index).toHaveBeenCalledTimes(2);
		expect(mockSchema.index).toHaveBeenNthCalledWith(1, {
			user: {
				profile: {
					name: 1
				}
			}
		});
		expect(mockSchema.index).toHaveBeenNthCalledWith(2, {
			settings: {
				theme: 1
			}
		});
	});

	it('should handle empty attributes array', () => {
		const attributes: string[] = [];
		const index = 1;

		addIndexToAttributes(mockSchema, attributes, index);

		expect(mockSchema.index).not.toHaveBeenCalled();
	});

	it('should handle mixed ascending and descending (different calls)', () => {
		const attributes1 = ['name'];
		const attributes2 = ['createdAt'];

		addIndexToAttributes(mockSchema, attributes1, 1);
		addIndexToAttributes(mockSchema, attributes2, -1);

		expect(mockSchema.index).toHaveBeenCalledTimes(2);
		expect(mockSchema.index).toHaveBeenNthCalledWith(1, {name: 1});
		expect(mockSchema.index).toHaveBeenNthCalledWith(2, {createdAt: -1});
	});
});
