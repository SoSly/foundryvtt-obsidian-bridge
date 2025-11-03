import { describe, it, expect } from '@jest/globals';
import fetchJournalContent from './fetch.js';
import ExportOptions from '../domain/ExportOptions.js';

function createMockPage(name, content = '<p>Test content</p>') {
    return {
        name,
        text: {
            content
        }
    };
}

function createMockJournal(name, pages = [], folder = null) {
    return {
        name,
        folder,
        pages: {
            size: pages.length,
            values: () => pages
        }
    };
}

function createMockFolder(name, parentFolder = null) {
    return {
        name,
        folder: parentFolder
    };
}

describe('fetchJournalContent', () => {
    describe('merge=false (separate files per page)', () => {
        it('creates one markdown file per page', () => {
            const page1 = createMockPage('Page One', '<p>Content 1</p>');
            const page2 = createMockPage('Page Two', '<p>Content 2</p>');
            const journal = createMockJournal('Test Journal', [page1, page2]);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result).toHaveLength(2);
            expect(result[0].filePath).toBe('test-journal/page-one.md');
            expect(result[0].content).toBe('<p>Content 1</p>');
            expect(result[1].filePath).toBe('test-journal/page-two.md');
            expect(result[1].content).toBe('<p>Content 2</p>');
        });

        it('generates correct file paths with folder hierarchy', () => {
            const grandparent = createMockFolder('Campaign');
            const parent = createMockFolder('NPCs', grandparent);
            const page = createMockPage('NPC Details');
            const journal = createMockJournal('Big Bad', [page], parent);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('campaign/npcs/big-bad/npc-details.md');
        });

        it('generates lookup keys from file paths', () => {
            const page = createMockPage('Test Page');
            const journal = createMockJournal('Test Journal', [page]);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result[0].lookupKeys).toEqual([
                'test-page',
                'test-journal/test-page'
            ]);
        });

        it('sanitizes names by removing special characters and replacing spaces', () => {
            const page = createMockPage('Test & Page #1!');
            const journal = createMockJournal('My "Cool" Journal', [page]);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result[0].filePath).toBe('my-cool-journal/test-page-1.md');
        });

        it('handles journals at root level (no folder)', () => {
            const page = createMockPage('Root Page');
            const journal = createMockJournal('Root Journal', [page], null);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result[0].filePath).toBe('root-journal/root-page.md');
        });

        it('initializes empty links and assets arrays', () => {
            const page = createMockPage('Test Page');
            const journal = createMockJournal('Test Journal', [page]);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result[0].links).toEqual([]);
            expect(result[0].assets).toEqual([]);
        });
    });

    describe('merge=true (one file per journal)', () => {
        it('creates one markdown file per journal with all pages', () => {
            const page1 = createMockPage('Page One', '<p>Content 1</p>');
            const page2 = createMockPage('Page Two', '<p>Content 2</p>');
            const journal = createMockJournal('Test Journal', [page1, page2]);

            const options = new ExportOptions({
                journals: [journal],
                merge: true
            });

            const result = fetchJournalContent(options);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('test-journal.md');
            expect(result[0].content).toBe('<h1>Page One</h1>\n<p>Content 1</p>\n\n<h1>Page Two</h1>\n<p>Content 2</p>');
        });

        it('generates correct file path with folder hierarchy', () => {
            const folder = createMockFolder('Campaign');
            const page = createMockPage('Story');
            const journal = createMockJournal('Arc 1', [page], folder);

            const options = new ExportOptions({
                journals: [journal],
                merge: true
            });

            const result = fetchJournalContent(options);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('campaign/arc-1.md');
        });

        it('generates lookup keys from file path', () => {
            const folder = createMockFolder('Campaign');
            const page = createMockPage('Story');
            const journal = createMockJournal('Arc 1', [page], folder);

            const options = new ExportOptions({
                journals: [journal],
                merge: true
            });

            const result = fetchJournalContent(options);

            expect(result[0].lookupKeys).toEqual([
                'arc-1',
                'campaign/arc-1'
            ]);
        });

        it('handles journals at root level', () => {
            const page = createMockPage('Page');
            const journal = createMockJournal('Root Journal', [page], null);

            const options = new ExportOptions({
                journals: [journal],
                merge: true
            });

            const result = fetchJournalContent(options);

            expect(result[0].filePath).toBe('root-journal.md');
        });
    });

    describe('edge cases', () => {
        it('skips journals with no pages', () => {
            const journal1 = createMockJournal('Empty Journal', []);
            const page = createMockPage('Valid Page');
            const journal2 = createMockJournal('Valid Journal', [page]);

            const options = new ExportOptions({
                journals: [journal1, journal2],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('valid-journal/valid-page.md');
        });

        it('returns empty array when all journals have no pages', () => {
            const journal1 = createMockJournal('Empty 1', []);
            const journal2 = createMockJournal('Empty 2', []);

            const options = new ExportOptions({
                journals: [journal1, journal2],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result).toEqual([]);
        });

        it('handles multiple journals with different folder structures', () => {
            const folder1 = createMockFolder('Campaign');
            const folder2 = createMockFolder('Rules');

            const page1 = createMockPage('NPC');
            const journal1 = createMockJournal('Characters', [page1], folder1);

            const page2 = createMockPage('Combat');
            const journal2 = createMockJournal('Homebrew', [page2], folder2);

            const options = new ExportOptions({
                journals: [journal1, journal2],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result).toHaveLength(2);
            expect(result[0].filePath).toBe('campaign/characters/npc.md');
            expect(result[1].filePath).toBe('rules/homebrew/combat.md');
        });

        it('handles deeply nested folder hierarchies', () => {
            const level1 = createMockFolder('World');
            const level2 = createMockFolder('Continent', level1);
            const level3 = createMockFolder('Region', level2);
            const level4 = createMockFolder('City', level3);

            const page = createMockPage('Location');
            const journal = createMockJournal('Tavern', [page], level4);

            const options = new ExportOptions({
                journals: [journal],
                merge: false
            });

            const result = fetchJournalContent(options);

            expect(result[0].filePath).toBe('world/continent/region/city/tavern/location.md');
        });
    });
});
