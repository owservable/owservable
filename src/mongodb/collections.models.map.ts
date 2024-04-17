'use strict';

import mongoose from 'mongoose';
import {Model} from 'mongoose';

export default class CollectionsModelsMap {
	public static addCollectionToModelMapping(model: Model<any>): void {
		CollectionsModelsMap._models.set(model.collection.collectionName, model.modelName);
	}

	public static getModelByCollection(collectionName: string): Model<any> | null {
		const modelName = CollectionsModelsMap._models.get(collectionName);
		if (!modelName) return null;
		return mongoose.model(modelName);
	}

	public static keys() {
		return Array.from(CollectionsModelsMap._models.keys());
	}

	public static values() {
		return Array.from(CollectionsModelsMap._models.values());
	}

	private static readonly _models: Map<string, string> = new Map<string, string>();
}
