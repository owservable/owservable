'use strict';

import * as mongoose from 'mongoose';
import {Connection} from 'mongoose';

export default class MongoDBConnector {
	public static async init(mongoDbUri: string): Promise<void | Connection> {
		if (!this._connection) {
			console.log('ows -> MongoDB connecting to', mongoDbUri);
			return mongoose
				.connect(mongoDbUri, {
					poolSize: 10,
					// useCreateIndex: true,	// does not work in MongoDB 5
					useNewUrlParser: true,
					useUnifiedTopology: true
				})
				.then(() => {
					this._connection = mongoose.connection;
					this._connection.on('error', console.error.bind(console, 'ows -> MongoDB connection error:'));
					this._connection.once('open', () => console.log('ows -> MongoDB connected to', mongoDbUri));

					return this._connection;
				})
				.catch(console.error);

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
