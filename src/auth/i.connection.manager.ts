'use strict';

import ConnectionManagerRefreshType from '../types/connection.manager.refresh.type';

export default interface IConnectionManager {
	user(): any;

	connected(jwt: any): Promise<void> | void;

	ping(ping: number): Promise<void> | void;

	location(location: string): Promise<void> | void;

	disconnected(): Promise<void> | void;

	checkSession(): Promise<ConnectionManagerRefreshType> | ConnectionManagerRefreshType;
}
