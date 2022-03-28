'use strict';

import {expect} from 'chai';
import getSubfolderPathsByFolderName from '../../src/functions/get.subfolder.paths.by.folder.name';

describe('getSubfolderPathsByFolderName tests', () => {
	it('expect test\\functions', () => {
		const folders: string[] = getSubfolderPathsByFolderName('test', 'functions');
		expect(folders.length).to.be.equal(2);
		expect(folders[0]).to.be.equal('test\\functions');
	});
	it('expect src\\functions', () => {
		const folders: string[] = getSubfolderPathsByFolderName('src', 'functions');
		expect(folders.length).to.be.equal(2);
		expect(folders).to.be.deep.equal(['src\\functions', 'src\\mongodb\\functions']);
	});
});
