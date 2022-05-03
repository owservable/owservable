'use strict';

import {expect} from 'chai';
import listSubfoldersByName from '../../src/functions/list.subfolders.by.name';

describe('getSubfoldersByName tests', () => {
	it('expect test\\functions', () => {
		const folders: string[] = listSubfoldersByName('test', 'functions');
		expect(folders.length).to.be.equal(2);
		expect(folders[0]).to.be.equal('test\\functions');
	});
	it('expect src\\functions', () => {
		const folders: string[] = listSubfoldersByName('src', 'functions');
		expect(folders.length).to.be.equal(2);
		expect(folders).to.be.deep.equal(['src\\functions', 'src\\mongodb\\functions']);
	});
});
