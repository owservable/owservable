'use strict';

// UNUSED:
type FastifyRouteType = {
	method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH';
	url?: string;
	preValidation?: () => void;
	handler: () => Promise<void>;
};
export default FastifyRouteType;
