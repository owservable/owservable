'use strict';

import * as mongoose from 'mongoose';
import {Connection} from 'mongoose';

export default class MongoDBConnector {
	public static async init(mongoDbUri: string): Promise<Connection> {
		if (!this._connection) {
			return new Promise(async (resolve, reject) => {
				console.log('');
				mongoose
					.connect(mongoDbUri, {
						minPoolSize: 20,
						maxPoolSize: 100
					})
					.then(() => {
						this._connection = mongoose.connection;
						resolve(this._connection);
					})
					.catch(reject);

				mongoose.connection.on('connecting', () => console.log('ows -> MongoDB connecting to', mongoDbUri, '...'));
				mongoose.connection.on('connected', () => console.log('ows -> MongoDB connected to', mongoDbUri));
				mongoose.connection.on('open', () => console.log('ows -> MongoDB opened connection to', mongoDbUri));

				mongoose.connection.on('error', console.error.bind(console, 'ows -> MongoDB connection error:'));
				mongoose.connection.on('disconnecting', () => console.error('ows -> MongoDB disconnecting from', mongoDbUri, '...'));
				mongoose.connection.on('disconnected', () => console.error('ows -> MongoDB disconnected from', mongoDbUri));
				mongoose.connection.on('close', () => console.error('ows -> MongoDB closed connection to', mongoDbUri));
			});

			//
		} else {
			return this._connection;
		}
	}

	public static get connection(): Connection {
		return this._connection;
	}

	private static _connection: Connection;

	private constructor() {}
}
