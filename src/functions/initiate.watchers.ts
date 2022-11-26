'use strict';

import executeWatcher from './execute/execute.watcher';
import executeProcessesInFolder from './execute/execute.processes.in.folder';

const initiateWatchers = (root: string, folder: string = 'watchers'): void => {
	executeProcessesInFolder(root, folder, executeWatcher);
};
export default initiateWatchers;
