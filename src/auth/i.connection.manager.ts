'use strict';

import ConnectionManagerRefreshType from '../types/connection.manager.refresh.type';

export default interface IConnectionManager {
	user(): any;

	connected(jwt: any): void;

	ping(ping: number): void;

	location(location: string): void;

	disconnected(): void;

	checkSession(): Promise<ConnectionManagerRefreshType> | ConnectionManagerRefreshType;
}
