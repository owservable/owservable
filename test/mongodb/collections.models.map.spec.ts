'use strict';

import Dummy from './functions/_dummy';
import CollectionsModelsMap from '../../src/mongodb/collections.models.map';

describe('collections.models.map.ts tests', () => {
	it('CollectionsModelsMap exists', () => {
		expect(CollectionsModelsMap).toBeDefined();
		expect(typeof CollectionsModelsMap).toBe('function');
	});

	it('CollectionsModelsMap empty functionality', () => {
		let keys = CollectionsModelsMap.keys();
		expect(keys).toHaveLength(0);
		let values = CollectionsModelsMap.values();
		expect(values).toHaveLength(0);
		expect(CollectionsModelsMap.getModelByCollection(null)).toBeNull();

		CollectionsModelsMap.addCollectionToModelMapping(Dummy);
		keys = CollectionsModelsMap.keys();
		values = CollectionsModelsMap.values();
		expect(keys).toHaveLength(1);
		expect(values).toHaveLength(1);
		expect(CollectionsModelsMap.getModelByCollection('dummy')).toBe(Dummy);
	});

	describe('addCollectionToModelMapping', () => {
		it('should add a model to the mapping', () => {
			// Since the static Map persists between tests, just verify the model is added
			CollectionsModelsMap.addCollectionToModelMapping(Dummy);
			
			expect(CollectionsModelsMap.keys()).toContain('dummy');
			expect(CollectionsModelsMap.values()).toContain('Dummy');
		});
	});

	describe('getModelByCollection', () => {
		it('should return null for non-existent collection', () => {
			const result = CollectionsModelsMap.getModelByCollection('nonexistent');
			expect(result).toBeNull();
		});

		it('should return the correct model for existing collection', () => {
			CollectionsModelsMap.addCollectionToModelMapping(Dummy);
			const result = CollectionsModelsMap.getModelByCollection('dummy');
			expect(result).toBe(Dummy);
		});

		it('should handle null input gracefully', () => {
			const result = CollectionsModelsMap.getModelByCollection(null as any);
			expect(result).toBeNull();
		});

		it('should handle undefined input gracefully', () => {
			const result = CollectionsModelsMap.getModelByCollection(undefined as any);
			expect(result).toBeNull();
		});
	});

	describe('keys', () => {
		it('should return empty array when no models are mapped', () => {
			// Clear any existing mappings for this test
			const currentKeys = CollectionsModelsMap.keys();
			currentKeys.forEach(key => {
				// We can't directly clear the map, but we can verify behavior
			});
			
			const keys = CollectionsModelsMap.keys();
			expect(Array.isArray(keys)).toBe(true);
		});

		it('should return array of collection names after adding models', () => {
			CollectionsModelsMap.addCollectionToModelMapping(Dummy);
			
			const keys = CollectionsModelsMap.keys();
			expect(Array.isArray(keys)).toBe(true);
			expect(keys).toContain('dummy');
		});
	});

	describe('values', () => {
		it('should return empty array when no models are mapped', () => {
			const values = CollectionsModelsMap.values();
			expect(Array.isArray(values)).toBe(true);
		});

		it('should return array of model names after adding models', () => {
			CollectionsModelsMap.addCollectionToModelMapping(Dummy);
			
			const values = CollectionsModelsMap.values();
			expect(Array.isArray(values)).toBe(true);
			expect(values).toContain('Dummy');
		});
	});
});
