#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';

export default class RoutesMap {
	public static add(method: string, route: string): void {
		method = _.toUpper(method);
		let routes = RoutesMap._routes.get(method) || [];
		routes.push(route);
		routes = _.sortBy(_.compact(_.uniq(routes)));
		RoutesMap._routes.set(method, routes);
	}

	public static getMethods(): string[] {
		return _.sortBy(_.compact(Array.from(RoutesMap._routes.keys())));
	}

	public static getRoutes(method: string): string[] | null {
		return RoutesMap._routes.get(_.toUpper(method));
	}

	public static keys() {
		return Array.from(RoutesMap._routes.keys());
	}

	public static values() {
		return Array.from(RoutesMap._routes.values());
	}

	public static list(): any {
		const obj: any = {};
		const methods = RoutesMap.getMethods();
		_.each(methods, (method) => (obj[method] = RoutesMap.getRoutes(method)));
		return obj;
	}

	public static json(): any {
		const obj: any = {};
		const methods = RoutesMap.getMethods();
		_.each(methods, (method) => {
			const apis = {};
			const routes = RoutesMap.getRoutes(method);
			_.each(routes, (route) => {
				let parts = _.split(route, '/');
				parts = _.compact(parts);
				const last = _.join(parts, '.');

				parts.pop();
				let paths = [_.join(parts, '.')];
				while (!_.isEmpty(parts)) {
					parts.pop();
					paths.push(_.join(parts, '.'));
				}
				paths = _.reverse(_.compact(paths));
				_.each(paths, (path) => {
					if (!_.get(apis, path)) _.set(apis, path, {});
				});

				_.set(apis, last, true);
			});
			obj[method] = apis;
		});
		return obj;
	}

	private static readonly _routes: Map<string, string[]> = new Map<string, string[]>();
}
