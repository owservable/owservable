#!/usr/bin/env node
'use strict';

import StoreScopeType from "../_types/store.scope.type";

const criteria = (scope: StoreScopeType, collection: string): string => `${scope}-${collection}`;

export default class DataMiddlewareMap {
	public static addMiddleware(scope: StoreScopeType, collection: string, processor: Function): void {
		DataMiddlewareMap._middlewares.set(criteria(scope, collection), processor);
	}

	public static hasMiddleware(scope: StoreScopeType, collection: string): boolean {
		return !!DataMiddlewareMap._middlewares.get(criteria(scope, collection));
	}

	public static getMiddleware(scope: StoreScopeType, collection: string): Function | null {
		return DataMiddlewareMap._middlewares.get(criteria(scope, collection));
	}

	public static keys() {
		return Array.from(DataMiddlewareMap._middlewares.keys());
	}

	private static readonly _middlewares: Map<string, Function> = new Map<string, Function>();
}
