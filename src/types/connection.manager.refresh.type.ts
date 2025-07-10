'use strict';

type ConnectionManagerRefreshType = {
	type: 'refresh';
	payload: {jwt: string; user: any};
	refresh_in: number;
};
export default ConnectionManagerRefreshType;
