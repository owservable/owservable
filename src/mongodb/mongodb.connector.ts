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

				mongoose.connection.on('connecting', () => console.log('[@owservable] -> MongoDB connecting to', mongoDbUri, '...'));
				mongoose.connection.on('connected', () => console.log('[@owservable] -> MongoDB connected to', mongoDbUri));
				mongoose.connection.on('open', () => console.log('[@owservable] -> MongoDB opened connection to', mongoDbUri));

				mongoose.connection.on('error', console.error.bind(console, '[@owservable] -> MongoDB connection error:'));
				mongoose.connection.on('disconnecting', () => console.error('[@owservable] -> MongoDB disconnecting from', mongoDbUri, '...'));
				mongoose.connection.on('disconnected', () => console.error('[@owservable] -> MongoDB disconnected from', mongoDbUri));
				mongoose.connection.on('close', () => console.error('[@owservable] -> MongoDB closed connection to', mongoDbUri));
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
