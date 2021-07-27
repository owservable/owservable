#!/usr/bin/env node
'use strict';

import * as mongoose from 'mongoose';
import {Connection} from 'mongoose';

export default class MongoDBConnector {
	public static init(mongoDbUri: string): Connection {
		if (!MongoDBConnector._instance) MongoDBConnector._instance = new MongoDBConnector(mongoDbUri);
		return MongoDBConnector._instance._connection;
	}

	public static get connection(): Connection {
		return MongoDBConnector._instance._connection;
	}

	private static _instance: MongoDBConnector;
	private readonly _connection: Connection;

	private constructor(mongoDbUri: string) {
		mongoose
			.connect(mongoDbUri, {
				poolSize: 10,
				useCreateIndex: true,
				useNewUrlParser: true,
				useUnifiedTopology: true
			})
			.then(() => ({}))
			.catch(console.error);

		this._connection = mongoose.connection;
		this._connection.on('error', console.error.bind(console, 'connection error:'));
		this._connection.once('open', () => console.log('ows -> MongoDB connected to', mongoDbUri));
	}
}
