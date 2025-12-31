import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { updateContent, rollbackUpdates } from './update';
import MarkdownFile from '../domain/MarkdownFile';

describe('journal/update', () => {
    let mockFromUuidSync;
    let consoleWarnSpy;

    beforeEach(() => {
        mockFromUuidSync = jest.fn();
        global.fromUuidSync = mockFromUuidSync;

        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    describe('updateContent', () => {
        it('updates page content for valid markdown files', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original content</p>' },
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>'
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            const result = await updateContent([markdownFile]);

            expect(mockFromUuidSync).toHaveBeenCalledWith(mockPage.uuid);
            expect(mockPage.update).toHaveBeenCalledWith({
                'text.content': '<p>New content</p>',
                'flags.obsidian-bridge.frontmatter': null
            });

            expect(result.updatedPages).toHaveLength(1);
            expect(result.updatedPages[0].page).toBe(mockPage);
            expect(result.updatedPages[0].originalContent).toBe('<p>Original content</p>');
        });

        it('updates multiple pages', async () => {
            const mockPage1 = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original 1</p>' },
                update: jest.fn().mockResolvedValue()
            };

            const mockPage2 = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-2',
                text: { content: '<p>Original 2</p>' },
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync
                .mockReturnValueOnce(mockPage1)
                .mockReturnValueOnce(mockPage2);

            const markdownFile1 = new MarkdownFile({
                filePath: 'test1.md',
                content: '<p>New 1</p>'
            });
            markdownFile1.foundryPageUuid = mockPage1.uuid;

            const markdownFile2 = new MarkdownFile({
                filePath: 'test2.md',
                content: '<p>New 2</p>'
            });
            markdownFile2.foundryPageUuid = mockPage2.uuid;

            const result = await updateContent([markdownFile1, markdownFile2]);

            expect(mockPage1.update).toHaveBeenCalledWith({
                'text.content': '<p>New 1</p>',
                'flags.obsidian-bridge.frontmatter': null
            });
            expect(mockPage2.update).toHaveBeenCalledWith({
                'text.content': '<p>New 2</p>',
                'flags.obsidian-bridge.frontmatter': null
            });

            expect(result.updatedPages).toHaveLength(2);
        });

        it('handles pages with no existing content', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: {},
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>'
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            const result = await updateContent([markdownFile]);

            expect(result.updatedPages[0].originalContent).toBe('');
        });

        it('handles pages with null text property', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: null,
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>'
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            const result = await updateContent([markdownFile]);

            expect(result.updatedPages[0].originalContent).toBe('');
        });

        it('skips files without foundryPageUuid and warns', async () => {
            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>Content</p>'
            });

            const result = await updateContent([markdownFile]);

            expect(consoleWarnSpy).toHaveBeenCalledWith('Skipping file without UUID: test.md');
            expect(mockFromUuidSync).not.toHaveBeenCalled();
            expect(result.updatedPages).toHaveLength(0);
        });

        it('throws error when page is not found', async () => {
            mockFromUuidSync.mockReturnValue(null);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>Content</p>'
            });
            markdownFile.foundryPageUuid = 'JournalEntry.entry-1.JournalEntryPage.missing';

            await expect(updateContent([markdownFile]))
                .rejects.toThrow('Page not found for UUID: JournalEntry.entry-1.JournalEntryPage.missing (test.md)');
        });

        it('returns empty updatedPages for empty array', async () => {
            const result = await updateContent([]);

            expect(result.updatedPages).toHaveLength(0);
            expect(mockFromUuidSync).not.toHaveBeenCalled();
        });

        it('returns empty updatedPages for null input', async () => {
            const result = await updateContent(null);

            expect(result.updatedPages).toHaveLength(0);
            expect(mockFromUuidSync).not.toHaveBeenCalled();
        });

        it('returns empty updatedPages for undefined input', async () => {
            const result = await updateContent(undefined);

            expect(result.updatedPages).toHaveLength(0);
            expect(mockFromUuidSync).not.toHaveBeenCalled();
        });

        it('continues processing after skipping file without UUID', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original</p>' },
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFileWithoutUuid = new MarkdownFile({
                filePath: 'no-uuid.md',
                content: '<p>Content 1</p>'
            });

            const markdownFileWithUuid = new MarkdownFile({
                filePath: 'with-uuid.md',
                content: '<p>Content 2</p>'
            });
            markdownFileWithUuid.foundryPageUuid = mockPage.uuid;

            const result = await updateContent([markdownFileWithoutUuid, markdownFileWithUuid]);

            expect(consoleWarnSpy).toHaveBeenCalledWith('Skipping file without UUID: no-uuid.md');
            expect(mockPage.update).toHaveBeenCalled();
            expect(result.updatedPages).toHaveLength(1);
        });

        it('stores frontmatter flag alongside content', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original</p>' },
                flags: {},
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>',
                frontmatter: 'title: Hello'
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            await updateContent([markdownFile]);

            expect(mockPage.update).toHaveBeenCalledWith({
                'text.content': '<p>New content</p>',
                'flags.obsidian-bridge.frontmatter': 'title: Hello'
            });
        });

        it('clears frontmatter flag when frontmatter is null', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original</p>' },
                flags: { 'obsidian-bridge': { frontmatter: 'old: value' } },
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>',
                frontmatter: null
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            await updateContent([markdownFile]);

            expect(mockPage.update).toHaveBeenCalledWith({
                'text.content': '<p>New content</p>',
                'flags.obsidian-bridge.frontmatter': null
            });
        });

        it('includes originalFrontmatter in return for rollback', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original</p>' },
                flags: { 'obsidian-bridge': { frontmatter: 'original: frontmatter' } },
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>',
                frontmatter: 'new: frontmatter'
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            const result = await updateContent([markdownFile]);

            expect(result.updatedPages[0].originalFrontmatter).toBe('original: frontmatter');
        });

        it('handles missing flags when storing originalFrontmatter', async () => {
            const mockPage = {
                uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
                text: { content: '<p>Original</p>' },
                update: jest.fn().mockResolvedValue()
            };

            mockFromUuidSync.mockReturnValue(mockPage);

            const markdownFile = new MarkdownFile({
                filePath: 'test.md',
                content: '<p>New content</p>',
                frontmatter: 'new: frontmatter'
            });
            markdownFile.foundryPageUuid = mockPage.uuid;

            const result = await updateContent([markdownFile]);

            expect(result.updatedPages[0].originalFrontmatter).toBeNull();
        });
    });

    describe('rollbackUpdates', () => {
        it('restores original content in reverse order', async () => {
            const updateOrder = [];

            const mockPage1 = {
                uuid: 'page-1',
                update: jest.fn().mockImplementation(data => {
                    updateOrder.push('page1');
                    return Promise.resolve();
                })
            };

            const mockPage2 = {
                uuid: 'page-2',
                update: jest.fn().mockImplementation(data => {
                    updateOrder.push('page2');
                    return Promise.resolve();
                })
            };

            const updatedPages = [
                { page: mockPage1, originalContent: '<p>Original 1</p>', originalFrontmatter: null },
                { page: mockPage2, originalContent: '<p>Original 2</p>', originalFrontmatter: null }
            ];

            await rollbackUpdates(updatedPages);

            expect(mockPage2.update).toHaveBeenCalledWith({
                'text.content': '<p>Original 2</p>',
                'flags.obsidian-bridge.frontmatter': null
            });
            expect(mockPage1.update).toHaveBeenCalledWith({
                'text.content': '<p>Original 1</p>',
                'flags.obsidian-bridge.frontmatter': null
            });
            expect(updateOrder).toEqual(['page2', 'page1']);
        });

        it('continues on error and does not throw', async () => {
            const mockPage1 = {
                uuid: 'page-1',
                update: jest.fn().mockRejectedValue(new Error('Update failed'))
            };

            const mockPage2 = {
                uuid: 'page-2',
                update: jest.fn().mockResolvedValue()
            };

            const updatedPages = [
                { page: mockPage1, originalContent: '<p>Original 1</p>', originalFrontmatter: null },
                { page: mockPage2, originalContent: '<p>Original 2</p>', originalFrontmatter: null }
            ];

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(rollbackUpdates(updatedPages)).resolves.not.toThrow();

            expect(mockPage2.update).toHaveBeenCalled();
            expect(mockPage1.update).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('handles empty array', async () => {
            await expect(rollbackUpdates([])).resolves.not.toThrow();
        });

        it('handles null input', async () => {
            await expect(rollbackUpdates(null)).resolves.not.toThrow();
        });

        it('handles undefined input', async () => {
            await expect(rollbackUpdates(undefined)).resolves.not.toThrow();
        });

        it('does not mutate original array', async () => {
            const mockPage = {
                uuid: 'page-1',
                update: jest.fn().mockResolvedValue()
            };

            const updatedPages = [
                { page: mockPage, originalContent: '<p>Original</p>', originalFrontmatter: null }
            ];

            const originalLength = updatedPages.length;

            await rollbackUpdates(updatedPages);

            expect(updatedPages).toHaveLength(originalLength);
            expect(updatedPages[0].page).toBe(mockPage);
        });

        it('restores both content and frontmatter flag', async () => {
            const mockPage = {
                uuid: 'page-1',
                update: jest.fn().mockResolvedValue()
            };

            const updatedPages = [
                {
                    page: mockPage,
                    originalContent: '<p>Original</p>',
                    originalFrontmatter: 'title: Original'
                }
            ];

            await rollbackUpdates(updatedPages);

            expect(mockPage.update).toHaveBeenCalledWith({
                'text.content': '<p>Original</p>',
                'flags.obsidian-bridge.frontmatter': 'title: Original'
            });
        });

        it('restores null frontmatter correctly', async () => {
            const mockPage = {
                uuid: 'page-1',
                update: jest.fn().mockResolvedValue()
            };

            const updatedPages = [
                {
                    page: mockPage,
                    originalContent: '<p>Original</p>',
                    originalFrontmatter: null
                }
            ];

            await rollbackUpdates(updatedPages);

            expect(mockPage.update).toHaveBeenCalledWith({
                'text.content': '<p>Original</p>',
                'flags.obsidian-bridge.frontmatter': null
            });
        });
    });
});
