import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createJournals, rollbackJournals } from './create';
import JournalStructurePlan from '../domain/JournalStructurePlan';
import MarkdownFile from '../domain/MarkdownFile';

describe('journal/create', () => {
    let mockGame;
    let mockFolder;
    let mockJournalEntry;
    let mockPage;

    beforeEach(() => {
        mockFolder = jest.fn();
        mockFolder.create = jest.fn();

        mockJournalEntry = jest.fn();
        mockJournalEntry.create = jest.fn();

        mockGame = {
            folders: {
                filter: jest.fn(() => [])
            },
            journal: []
        };

        mockPage = {
            id: 'page-1',
            uuid: 'JournalEntry.entry-1.JournalEntryPage.page-1',
            name: 'Test Page'
        };

        global.game = mockGame;
        global.Folder = mockFolder;
        global.JournalEntry = mockJournalEntry;
    });

    describe('createJournals', () => {
        it('creates new folders when none exist', async () => {
            const folder = {
                id: 'folder-1',
                name: 'Test Folder',
                delete: jest.fn()
            };

            mockFolder.create.mockResolvedValue(folder);
            mockJournalEntry.create.mockResolvedValue({
                id: 'entry-1',
                name: 'Test Entry',
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([mockPage]),
                delete: jest.fn()
            });

            const plan = new JournalStructurePlan({
                folders: [
                    { path: 'Test Folder', name: 'Test Folder', parentPath: null }
                ],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: 'Test Folder',
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [plan.entries[0].pages[0].markdownFile]);

            expect(mockFolder.create).toHaveBeenCalledWith({
                name: 'Test Folder',
                type: 'JournalEntry',
                folder: null
            });

            expect(result.createdFolders).toHaveLength(1);
            expect(result.createdFolders[0]).toBe(folder);
        });

        it('reuses existing folders with matching parent and name', async () => {
            const existingFolder = {
                id: 'existing-folder',
                name: 'Existing Folder',
                folder: null
            };

            mockGame.folders.filter.mockReturnValue([existingFolder]);

            mockJournalEntry.create.mockResolvedValue({
                id: 'entry-1',
                name: 'Test Entry',
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([mockPage]),
                delete: jest.fn()
            });

            const plan = new JournalStructurePlan({
                folders: [
                    { path: 'Existing Folder', name: 'Existing Folder', parentPath: null }
                ],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: 'Existing Folder',
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [plan.entries[0].pages[0].markdownFile]);

            expect(mockFolder.create).not.toHaveBeenCalled();
            expect(result.createdFolders).toHaveLength(0);
        });

        it('creates nested folder hierarchies', async () => {
            const parentFolder = {
                id: 'parent-folder',
                name: 'Parent',
                delete: jest.fn()
            };

            const childFolder = {
                id: 'child-folder',
                name: 'Child',
                delete: jest.fn()
            };

            mockFolder.create
                .mockResolvedValueOnce(parentFolder)
                .mockResolvedValueOnce(childFolder);

            mockJournalEntry.create.mockResolvedValue({
                id: 'entry-1',
                name: 'Test Entry',
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([mockPage]),
                delete: jest.fn()
            });

            const plan = new JournalStructurePlan({
                folders: [
                    { path: 'Parent', name: 'Parent', parentPath: null },
                    { path: 'Parent/Child', name: 'Child', parentPath: 'Parent' }
                ],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: 'Parent/Child',
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [plan.entries[0].pages[0].markdownFile]);

            expect(mockFolder.create).toHaveBeenCalledTimes(2);
            expect(mockFolder.create).toHaveBeenNthCalledWith(1, {
                name: 'Parent',
                type: 'JournalEntry',
                folder: null
            });
            expect(mockFolder.create).toHaveBeenNthCalledWith(2, {
                name: 'Child',
                type: 'JournalEntry',
                folder: 'parent-folder'
            });

            expect(result.createdFolders).toHaveLength(2);
        });

        it('creates new journal entries when none exist', async () => {
            const entry = {
                id: 'entry-1',
                name: 'Test Entry',
                folder: null,
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([mockPage]),
                delete: jest.fn()
            };

            mockJournalEntry.create.mockResolvedValue(entry);

            const plan = new JournalStructurePlan({
                folders: [],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: null,
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [plan.entries[0].pages[0].markdownFile]);

            expect(mockJournalEntry.create).toHaveBeenCalledWith({
                name: 'Test Entry',
                folder: null
            });

            expect(result.createdEntries).toHaveLength(1);
            expect(result.createdEntries[0]).toBe(entry);
        });

        it('reuses existing journal entries with matching folder and name', async () => {
            const existingEntry = {
                id: 'existing-entry',
                name: 'Existing Entry',
                folder: null,
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([mockPage])
            };

            mockGame.journal = [existingEntry];

            const plan = new JournalStructurePlan({
                folders: [],
                entries: [
                    {
                        name: 'Existing Entry',
                        folderPath: null,
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [plan.entries[0].pages[0].markdownFile]);

            expect(mockJournalEntry.create).not.toHaveBeenCalled();
            expect(result.createdEntries).toHaveLength(0);
        });

        it('creates new pages when none exist', async () => {
            const entry = {
                id: 'entry-1',
                name: 'Test Entry',
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([mockPage]),
                delete: jest.fn()
            };

            mockJournalEntry.create.mockResolvedValue(entry);

            const markdownFile = new MarkdownFile({ filePath: 'test.md' });
            const plan = new JournalStructurePlan({
                folders: [],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: null,
                        pages: [
                            { name: 'Test Page', markdownFile }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [markdownFile]);

            expect(entry.createEmbeddedDocuments).toHaveBeenCalledWith('JournalEntryPage', [{
                name: 'Test Page',
                type: 'text',
                text: { content: '' }
            }]);

            expect(result.createdPages).toHaveLength(1);
            expect(result.createdPages[0].page).toBe(mockPage);
            expect(markdownFile.foundryPageUuid).toBe(mockPage.uuid);
        });

        it('reuses existing pages with matching name', async () => {
            const existingPage = {
                id: 'existing-page',
                uuid: 'JournalEntry.entry-1.JournalEntryPage.existing-page',
                name: 'Existing Page'
            };

            const entry = {
                id: 'entry-1',
                name: 'Test Entry',
                pages: [existingPage],
                createEmbeddedDocuments: jest.fn()
            };

            mockGame.journal = [entry];

            const markdownFile = new MarkdownFile({ filePath: 'test.md' });
            const plan = new JournalStructurePlan({
                folders: [],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: null,
                        pages: [
                            { name: 'Existing Page', markdownFile }
                        ]
                    }
                ]
            });

            const result = await createJournals(plan, [markdownFile]);

            expect(entry.createEmbeddedDocuments).not.toHaveBeenCalled();
            expect(result.createdPages).toHaveLength(0);
            expect(markdownFile.foundryPageUuid).toBe(existingPage.uuid);
        });

        it('throws error when folder creation fails', async () => {
            mockFolder.create.mockResolvedValue(null);

            const plan = new JournalStructurePlan({
                folders: [
                    { path: 'Test Folder', name: 'Test Folder', parentPath: null }
                ],
                entries: []
            });

            await expect(createJournals(plan, [])).rejects.toThrow('Failed to create folder: Test Folder');
        });

        it('throws error when entry creation fails', async () => {
            mockJournalEntry.create.mockResolvedValue(null);

            const plan = new JournalStructurePlan({
                folders: [],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: null,
                        pages: []
                    }
                ]
            });

            await expect(createJournals(plan, [])).rejects.toThrow('Failed to create journal entry: Test Entry');
        });

        it('throws error when page creation fails', async () => {
            const entry = {
                id: 'entry-1',
                name: 'Test Entry',
                pages: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
                delete: jest.fn()
            };

            mockJournalEntry.create.mockResolvedValue(entry);

            const plan = new JournalStructurePlan({
                folders: [],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: null,
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            await expect(createJournals(plan, [plan.entries[0].pages[0].markdownFile]))
                .rejects.toThrow('Failed to create page: Test Page in Test Entry');
        });

        it('rolls back created documents on error', async () => {
            const folder = {
                id: 'folder-1',
                name: 'Test Folder',
                delete: jest.fn().mockResolvedValue()
            };

            const entry = {
                id: 'entry-1',
                name: 'Test Entry',
                pages: [],
                createEmbeddedDocuments: jest.fn().mockRejectedValue(new Error('Page creation failed')),
                delete: jest.fn().mockResolvedValue(),
                deleteEmbeddedDocuments: jest.fn().mockResolvedValue()
            };

            mockFolder.create.mockResolvedValue(folder);
            mockJournalEntry.create.mockResolvedValue(entry);

            const plan = new JournalStructurePlan({
                folders: [
                    { path: 'Test Folder', name: 'Test Folder', parentPath: null }
                ],
                entries: [
                    {
                        name: 'Test Entry',
                        folderPath: 'Test Folder',
                        pages: [
                            { name: 'Test Page', markdownFile: new MarkdownFile({ filePath: 'test.md' }) }
                        ]
                    }
                ]
            });

            await expect(createJournals(plan, [plan.entries[0].pages[0].markdownFile]))
                .rejects.toThrow('Page creation failed');

            expect(entry.delete).toHaveBeenCalled();
            expect(folder.delete).toHaveBeenCalled();
        });
    });

    describe('rollbackJournals', () => {
        it('deletes pages in reverse order', async () => {
            const deleteSpy = jest.fn().mockResolvedValue();

            const pages = [
                {
                    entry: { deleteEmbeddedDocuments: deleteSpy },
                    page: { id: 'page-1', name: 'Page 1' }
                },
                {
                    entry: { deleteEmbeddedDocuments: deleteSpy },
                    page: { id: 'page-2', name: 'Page 2' }
                }
            ];

            await rollbackJournals(pages, [], []);

            expect(deleteSpy).toHaveBeenCalledTimes(2);
            expect(deleteSpy).toHaveBeenNthCalledWith(1, 'JournalEntryPage', ['page-2']);
            expect(deleteSpy).toHaveBeenNthCalledWith(2, 'JournalEntryPage', ['page-1']);
        });

        it('deletes entries in reverse order', async () => {
            const entries = [
                { id: 'entry-1', name: 'Entry 1', delete: jest.fn().mockResolvedValue() },
                { id: 'entry-2', name: 'Entry 2', delete: jest.fn().mockResolvedValue() }
            ];

            await rollbackJournals([], entries, []);

            expect(entries[1].delete).toHaveBeenCalled();
            expect(entries[0].delete).toHaveBeenCalled();
        });

        it('deletes folders in reverse order', async () => {
            const folders = [
                { id: 'folder-1', name: 'Folder 1', delete: jest.fn().mockResolvedValue() },
                { id: 'folder-2', name: 'Folder 2', delete: jest.fn().mockResolvedValue() }
            ];

            await rollbackJournals([], [], folders);

            expect(folders[1].delete).toHaveBeenCalled();
            expect(folders[0].delete).toHaveBeenCalled();
        });

        it('continues on error and does not throw', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const pages = [
                {
                    entry: { deleteEmbeddedDocuments: jest.fn().mockRejectedValue(new Error('Delete failed')) },
                    page: { id: 'page-1', name: 'Page 1' }
                }
            ];

            const entries = [
                { id: 'entry-1', name: 'Entry 1', delete: jest.fn().mockRejectedValue(new Error('Delete failed')) }
            ];

            const folders = [
                { id: 'folder-1', name: 'Folder 1', delete: jest.fn().mockRejectedValue(new Error('Delete failed')) }
            ];

            await expect(rollbackJournals(pages, entries, folders)).resolves.not.toThrow();

            expect(pages[0].entry.deleteEmbeddedDocuments).toHaveBeenCalled();
            expect(entries[0].delete).toHaveBeenCalled();
            expect(folders[0].delete).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('deletes in correct order: pages, then entries, then folders', async () => {
            const deleteOrder = [];

            const pages = [{
                entry: {
                    deleteEmbeddedDocuments: jest.fn().mockImplementation(() => {
                        deleteOrder.push('page');
                        return Promise.resolve();
                    })
                },
                page: { id: 'page-1', name: 'Page 1' }
            }];

            const entries = [{
                id: 'entry-1',
                name: 'Entry 1',
                delete: jest.fn().mockImplementation(() => {
                    deleteOrder.push('entry');
                    return Promise.resolve();
                })
            }];

            const folders = [{
                id: 'folder-1',
                name: 'Folder 1',
                delete: jest.fn().mockImplementation(() => {
                    deleteOrder.push('folder');
                    return Promise.resolve();
                })
            }];

            await rollbackJournals(pages, entries, folders);

            expect(deleteOrder).toEqual(['page', 'entry', 'folder']);
        });
    });
});
