'use strict';

import {hrtime} from 'node:process';

const getHrtimeAsNumber = (): number => Number(hrtime.bigint());
export default getHrtimeAsNumber;
