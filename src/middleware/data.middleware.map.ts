'use strict';

export default class DataMiddlewareMap {
	public static addMiddleware(collection: string, processor: Function): void {
		DataMiddlewareMap._middlewares.set(`${collection}`, processor);
	}

	public static hasMiddleware(collection: string): boolean {
		return !!DataMiddlewareMap._middlewares.get(`${collection}`);
	}

	public static getMiddleware(collection: string): Function | null {
		return DataMiddlewareMap._middlewares.get(`${collection}`);
	}

	public static keys() {
		return Array.from(DataMiddlewareMap._middlewares.keys());
	}

	private static readonly _middlewares: Map<string, Function> = new Map<string, Function>();
}
