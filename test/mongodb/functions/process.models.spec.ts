'use strict';

import * as fs from 'fs';
import * as path from 'path';
import processModels from '../../../src/mongodb/functions/process.models';
import CollectionsModelsMap from '../../../src/mongodb/collections.models.map';

jest.mock('fs');
jest.mock('path');
jest.mock('@owservable/folders');
jest.mock('../../../src/mongodb/collections.models.map');

describe('process.models.ts tests', () => {
	let mockFs: jest.Mocked<typeof import('fs')>;
	let mockPath: jest.Mocked<typeof import('path')>;
	let mockListSubfoldersByName: jest.MockedFunction<any>;
	let mockAddCollectionToModelMapping: jest.MockedFunction<any>;
	let originalRequire: NodeRequire;

	beforeAll(() => {
		mockFs = require('fs');
		mockPath = require('path');
		mockListSubfoldersByName = require('@owservable/folders').listSubfoldersByName;
		mockAddCollectionToModelMapping = CollectionsModelsMap.addCollectionToModelMapping as jest.MockedFunction<any>;

		mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
		mockPath.extname.mockImplementation((fileName: string) => {
			const lastDot: number = fileName.lastIndexOf('.');
			return lastDot === -1 ? '' : fileName.substring(lastDot);
		});
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockListSubfoldersByName.mockReturnValue([]);
		mockFs.readdirSync.mockReturnValue([]);
		mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('basic functionality', () => {
		it('should exist and be a function', () => {
			expect(processModels).toBeDefined();
			expect(typeof processModels).toBe('function');
		});

		it('should call listSubfoldersByName with correct parameters', () => {
			mockListSubfoldersByName.mockReturnValue([]);

			processModels('/test/root', 'models');

			expect(mockListSubfoldersByName).toHaveBeenCalledWith('/test/root', 'models');
		});

		it('should use default folder name "models" when not provided', () => {
			mockListSubfoldersByName.mockReturnValue([]);

			processModels('/test/root');

			expect(mockListSubfoldersByName).toHaveBeenCalledWith('/test/root', 'models');
		});

		it('should handle empty folders array', () => {
			mockListSubfoldersByName.mockReturnValue([]);

			expect(() => processModels('/test/root', 'models')).not.toThrow();
			expect(mockListSubfoldersByName).toHaveBeenCalled();
		});

		it('should process multiple root folders', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models1', '/test/models2', '/test/models3']);
			mockFs.readdirSync.mockReturnValue([]);

			processModels('/test/root', 'models');

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(3);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models1');
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models2');
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models3');
		});
	});

	describe('file filtering', () => {
		it('should read .ts files', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue(['model.ts'] as any);
			mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);

			try {
				processModels('/test/root', 'models');
			} catch (error) {}

			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/model.ts');
		});

		it('should read .js files', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue(['model.js'] as any);
			mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);

			try {
				processModels('/test/root', 'models');
			} catch (error) {}

			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/model.js');
		});

		it('should skip files without .ts or .js extension', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue(['readme.md', 'config.json', 'data.txt', 'image.png'] as any);
			mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);

			expect(() => processModels('/test/root', 'models')).not.toThrow();

			expect(mockFs.lstatSync).toHaveBeenCalledTimes(4);
		});

		it('should handle mixed file types', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue(['model1.ts', 'readme.md', 'model2.js', 'config.json'] as any);
			mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);

			try {
				processModels('/test/root', 'models');
			} catch (error) {}

			expect(mockFs.lstatSync).toHaveBeenCalledTimes(4);
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/model1.ts');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/model2.js');
		});
	});

	describe('folder traversal', () => {
		it('should recursively process subfolders', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);

			let callCount: number = 0;
			mockFs.readdirSync.mockImplementation((() => {
				callCount++;
				if (callCount === 1) return ['subfolder'] as any;
				return [] as any;
			}) as any);

			mockFs.lstatSync.mockReturnValue({isDirectory: () => true} as any);

			processModels('/test/root', 'models');

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models/subfolder');
		});

		it('should handle mixed files and folders', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);

			let isFirstCall: boolean = true;
			mockFs.readdirSync.mockImplementation((() => {
				if (isFirstCall) {
					isFirstCall = false;
					return ['subfolder', 'readme.md'] as any;
				}
				return [] as any;
			}) as any);

			mockFs.lstatSync.mockImplementation(((filePath: any) => {
				const isDir: boolean = String(filePath).includes('subfolder');
				return {isDirectory: () => isDir} as any;
			}) as any);

			processModels('/test/root', 'models');

			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models/subfolder');
			expect(mockFs.lstatSync).toHaveBeenCalled();
		});

		it('should handle deeply nested folder structures', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);

			let depth: number = 0;
			mockFs.readdirSync.mockImplementation((() => {
				depth++;
				if (depth <= 3) return ['level' + depth] as any;
				return [] as any;
			}) as any);

			mockFs.lstatSync.mockReturnValue({isDirectory: () => true} as any);

			processModels('/test/root', 'models');

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(4);
		});

		it('should separate files and folders correctly', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);

			let callCount: number = 0;
			mockFs.readdirSync.mockImplementation((() => {
				callCount++;
				if (callCount === 1) {
					return ['folder1', 'file1.txt', 'folder2', 'file2.md'] as any;
				}
				return [] as any;
			}) as any);

			mockFs.lstatSync.mockImplementation(((path: any) => {
				const pathStr: string = String(path);
				const isDir: boolean = pathStr.includes('folder');
				return {isDirectory: () => isDir} as any;
			}) as any);

			processModels('/test/root', 'models');

			expect(mockFs.lstatSync).toHaveBeenCalledTimes(4);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models/folder1');
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models/folder2');
		});
	});

	describe('exclusion logic', () => {
		it('should exclude folders matching string exclude pattern', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models', '/test/excluded']);
			mockFs.readdirSync.mockReturnValue([]);

			processModels('/test/root', 'models', 'excluded');

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(1);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
			expect(mockFs.readdirSync).not.toHaveBeenCalledWith('/test/excluded');
		});

		it('should exclude folders matching array exclude patterns', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models', '/test/excluded1', '/test/excluded2', '/test/other']);
			mockFs.readdirSync.mockReturnValue([]);

			processModels('/test/root', 'models', ['excluded1', 'excluded2']);

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/other');
			expect(mockFs.readdirSync).not.toHaveBeenCalledWith('/test/excluded1');
			expect(mockFs.readdirSync).not.toHaveBeenCalledWith('/test/excluded2');
		});

		it('should handle undefined exclude parameter', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue([]);

			expect(() => processModels('/test/root', 'models', undefined)).not.toThrow();
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
		});

		it('should handle null exclude parameter', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue([]);

			expect(() => processModels('/test/root', 'models', null as any)).not.toThrow();
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
		});

		it('should handle empty array exclude parameter', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue([]);

			processModels('/test/root', 'models', []);

			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models');
		});

		it('should exclude folders with partial path matches', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models/user/excluded', '/test/models/admin']);
			mockFs.readdirSync.mockReturnValue([]);

			processModels('/test/root', 'models', 'excluded');

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(1);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models/admin');
		});

		it('should handle multiple exclusions from array', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models/user/temp', '/test/models/admin/backup', '/test/models/public/cache', '/test/models/api']);
			mockFs.readdirSync.mockReturnValue([]);

			processModels('/test/root', 'models', ['temp', 'backup', 'cache']);

			expect(mockFs.readdirSync).toHaveBeenCalledTimes(1);
			expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/models/api');
		});
	});

	describe('edge cases', () => {
		it('should handle folders with no files or subfolders', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue([]);

			expect(() => processModels('/test/root', 'models')).not.toThrow();
		});

		it('should throw error when model default export is missing', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue(['invalid.ts'] as any);
			mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);

			jest.doMock('/test/models/invalid.ts', () => ({}), {virtual: true});

			expect(() => processModels('/test/root', 'models')).toThrow('Model not found in /test/models/invalid.ts');
		});

		it('should call addCollectionToModelMapping when model default export exists', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);
			mockFs.readdirSync.mockReturnValue(['valid.ts'] as any);
			mockFs.lstatSync.mockReturnValue({isDirectory: () => false} as any);

			const mockModel: any = {modelName: 'TestModel'};
			jest.doMock('/test/models/valid.ts', () => ({default: mockModel}), {virtual: true});

			processModels('/test/root', 'models');

			expect(mockAddCollectionToModelMapping).toHaveBeenCalledWith(mockModel);
		});

		it('should handle ItemStat mapping with mixed content', () => {
			mockListSubfoldersByName.mockReturnValue(['/test/models']);

			let callCount: number = 0;
			mockFs.readdirSync.mockImplementation((() => {
				callCount++;
				if (callCount === 1) {
					return ['file1.js', 'folder1', 'file2.ts', 'folder2', 'ignore.txt'] as any;
				}
				return [] as any;
			}) as any);

			mockFs.lstatSync.mockImplementation(((path: any) => {
				const pathStr: string = String(path);
				const isDir: boolean = pathStr.includes('folder');
				return {isDirectory: () => isDir} as any;
			}) as any);

			try {
				processModels('/test/root', 'models');
			} catch (error) {}

			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/file1.js');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/folder1');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/file2.ts');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/folder2');
			expect(mockFs.lstatSync).toHaveBeenCalledWith('/test/models/ignore.txt');
		});
	});
});
