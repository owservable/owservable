'use strict';

import executeWorker from './execute/execute.worker';
import executeProcessesInFolder from './execute/execute.processes.in.folder';

const initiateWorkers = (root: string, folder: string = 'workers'): void => {
	executeProcessesInFolder(root, folder, executeWorker);
};
export default initiateWorkers;
