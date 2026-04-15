'use strict';

export type DataMiddlewareProcessor = (doc: unknown, user: unknown) => unknown | Promise<unknown>;

export default class DataMiddlewareMap {
	public static addMiddleware(collection: string, processor: DataMiddlewareProcessor): void {
		DataMiddlewareMap._middlewares.set(`${collection}`, processor);
	}

	public static hasMiddleware(collection: string): boolean {
		return !!DataMiddlewareMap._middlewares.get(`${collection}`);
	}

	public static getMiddleware(collection: string): DataMiddlewareProcessor | undefined {
		return DataMiddlewareMap._middlewares.get(`${collection}`);
	}

	public static keys() {
		return Array.from(DataMiddlewareMap._middlewares.keys());
	}

	private static readonly _middlewares: Map<string, DataMiddlewareProcessor> = new Map<string, DataMiddlewareProcessor>();
}
