'use strict';

import getSecondsFrom from './get.seconds.from';

const getMillisecondsFrom = (start: number): number => getSecondsFrom(start) * 1000;
export default getMillisecondsFrom;
