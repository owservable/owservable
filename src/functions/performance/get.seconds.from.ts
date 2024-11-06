'use strict';

import getHrtimeAsNumber from './get.hrtime.as.number';

export const NS_PER_SEC: number = 1e9;

const getSecondsFrom = (start: number): number => Number(getHrtimeAsNumber() - start) / NS_PER_SEC;
export default getSecondsFrom;
