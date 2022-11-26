'use strict';

import executeCronjob from './execute/execute.cronjob';
import executeProcessesInFolder from './execute/execute.processes.in.folder';

const initiateCronjobs = (root: string, folder: string = 'cronjobs'): void => {
	executeProcessesInFolder(root, folder, executeCronjob);
};
export default initiateCronjobs;
