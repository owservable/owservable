'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import executeOnFilesRecursively from '../../../src/functions/execute/execute.on.files.recursively';

describe('execute.on.files.recursively tests', () => {
	let mockExecute: jest.MockedFunction<any>;
	let testDir: string;

	beforeEach(() => {
		mockExecute = jest.fn();
		// Create a unique test directory in OS temp
		testDir = path.join(os.tmpdir(), 'test-execute-recursively-' + Date.now());
	});

	afterEach(() => {
		// Clean up test directory if it exists
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, {recursive: true, force: true});
		}
	});

	describe('executeOnFilesRecursively function', () => {
		it('should exist and be a function', () => {
			expect(executeOnFilesRecursively).toBeDefined();
			expect(typeof executeOnFilesRecursively).toBe('function');
		});

		it('should execute on files in a folder', () => {
			// Create test directory structure
			fs.mkdirSync(testDir, {recursive: true});

			// Create test files with simple exports
			const file1 = path.join(testDir, 'test1.js');
			const file2 = path.join(testDir, 'test2.js');

			fs.writeFileSync(file1, 'module.exports = { default: "test1" };');
			fs.writeFileSync(file2, 'module.exports = { default: "test2" };');

			executeOnFilesRecursively(testDir, mockExecute);

			expect(mockExecute).toHaveBeenCalledTimes(2);
			expect(mockExecute).toHaveBeenCalledWith('test1');
			expect(mockExecute).toHaveBeenCalledWith('test2');
		});

		it('should handle empty folders', () => {
			fs.mkdirSync(testDir, {recursive: true});

			executeOnFilesRecursively(testDir, mockExecute);

			expect(mockExecute).not.toHaveBeenCalled();
		});

		it('should handle folders with only subdirectories', () => {
			// Create nested structure
			const subDir = path.join(testDir, 'subdir');
			fs.mkdirSync(subDir, {recursive: true});

			const subFile = path.join(subDir, 'subtest.js');
			fs.writeFileSync(subFile, 'module.exports = { default: "subtest" };');

			executeOnFilesRecursively(testDir, mockExecute);

			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith('subtest');
		});

		it('should handle files without default export gracefully', () => {
			fs.mkdirSync(testDir, {recursive: true});

			const file1 = path.join(testDir, 'nodefault.js');
			fs.writeFileSync(file1, 'module.exports = { someOtherExport: "value" };');

			executeOnFilesRecursively(testDir, mockExecute);

			// Should execute with undefined (no default export)
			expect(mockExecute).toHaveBeenCalledWith(undefined);
		});
	});
});
