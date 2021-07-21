#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import {FastifyInstance} from 'fastify';
import {IncomingMessage, Server, ServerResponse} from 'http';
import cleanRelativePath from './clean.relative.path';

let routesRootFolder: string;
const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

const _fixUrl = (url: string, relativeFilePath: string): string => {
	url = relativeFilePath + url;
	url = _.join(_.split(url, '//'), '/');
	if (_.endsWith(url, '/')) url = url.slice(0, -1);
	return url;
};

const _addRoute = (fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, route: any, relativeFilePath: string): void => {
	if (!_.has(route, 'url')) route.url = '/';

	const {url} = route;
	if (!_.startsWith(_.toLower(url), relativeFilePath)) route.url = _fixUrl(url, relativeFilePath);

	if (_.has(route, 'method')) route.method = _.toUpper(route.method);
	else route.method = 'GET';

	if (_.isPlainObject(route) && METHODS.includes(route.method)) fastify.route(route);
};

const addFastifyRoutes = (fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, folder: string): void => {
	if (!routesRootFolder) routesRootFolder = folder;

	const fileNames = fs.readdirSync(folder);
	const files = _.filter(fileNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	files.forEach((file: string) => {
		const ext = path.extname(file);
		if (ext !== '.ts' && ext !== '.js') return;
		const absoluteFilePath = path.join(folder, file);
		const relativeFilePath = cleanRelativePath(routesRootFolder, absoluteFilePath, ext);

		const route = require(absoluteFilePath);
		if (_.isArray(route)) _.each(route, (r: any) => _addRoute(fastify, r, relativeFilePath));
		else _addRoute(fastify, route, relativeFilePath);
	});

	const folders = _.filter(fileNames, (name: string) => fs.lstatSync(path.join(folder, name)).isDirectory());
	folders.forEach((sub: string) => addFastifyRoutes(fastify, path.join(folder, sub)));
};
export default addFastifyRoutes;
