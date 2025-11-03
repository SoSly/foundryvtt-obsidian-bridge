import { describe, it, expect } from '@jest/globals';
import prepareJournalsForExport from './prepare.js';
import MarkdownFile from '../domain/MarkdownFile.js';

describe('prepareJournalsForExport', () => {
    describe('with merge=false (separate page files)', () => {
        it('should create separate MarkdownFile for each page', () => {
            const journals = [
                {
                    name: 'Quest Log',
                    uuid: 'JournalEntry.abc123',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Introduction',
                                uuid: 'JournalEntry.abc123.JournalEntryPage.page1',
                                text: { content: '<p>Intro content</p>' }
                            },
                            {
                                name: 'Chapter 1',
                                uuid: 'JournalEntry.abc123.JournalEntryPage.page2',
                                text: { content: '<p>Chapter 1 content</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(MarkdownFile);
            expect(result[0].filePath).toBe('Quest Log/Introduction.md');
            expect(result[0].content).toBe('<p>Intro content</p>');
            expect(result[0].foundryPageUuid).toBe('JournalEntry.abc123.JournalEntryPage.page1');
            expect(result[1].filePath).toBe('Quest Log/Chapter 1.md');
            expect(result[1].content).toBe('<p>Chapter 1 content</p>');
            expect(result[1].foundryPageUuid).toBe('JournalEntry.abc123.JournalEntryPage.page2');
        });

        it('should include folder in file path when journal has folder', () => {
            const journals = [
                {
                    name: 'Session Notes',
                    uuid: 'JournalEntry.xyz789',
                    folder: { name: 'Campaign' },
                    pages: {
                        contents: [
                            {
                                name: 'Session 1',
                                uuid: 'JournalEntry.xyz789.JournalEntryPage.page1',
                                text: { content: '<p>Session 1 notes</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('Campaign/Session Notes/Session 1.md');
        });

        it('should generate correct lookup keys for pages', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc',
                    folder: { name: 'Folder' },
                    pages: {
                        contents: [
                            {
                                name: 'Page',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page1',
                                text: { content: '<p>Content</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result[0].lookupKeys).toEqual([
                'Page',
                'Journal/Page',
                'Folder/Journal/Page'
            ]);
        });

        it('should handle empty page content', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Empty Page',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page1',
                                text: { content: '' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('');
        });

        it('should handle page with no text property', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'No Text',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page1',
                                text: null
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('');
        });

        it('should initialize empty links and assets arrays', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page1',
                                text: { content: '<p>Content</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result[0].links).toEqual([]);
            expect(result[0].assets).toEqual([]);
        });
    });

    describe('with merge=true (merged journal files)', () => {
        it('should merge all pages into single file per journal', () => {
            const journals = [
                {
                    name: 'Quest Log',
                    uuid: 'JournalEntry.abc123',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Introduction',
                                uuid: 'JournalEntry.abc123.JournalEntryPage.page1',
                                text: { content: '<p>Intro content</p>' }
                            },
                            {
                                name: 'Chapter 1',
                                uuid: 'JournalEntry.abc123.JournalEntryPage.page2',
                                text: { content: '<p>Chapter 1 content</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(MarkdownFile);
            expect(result[0].filePath).toBe('Quest Log.md');
            expect(result[0].content).toBe('<p>Intro content</p>\n\n<p>Chapter 1 content</p>');
            expect(result[0].foundryPageUuid).toBe('JournalEntry.abc123');
        });

        it('should include folder in file path when journal has folder', () => {
            const journals = [
                {
                    name: 'Session Notes',
                    uuid: 'JournalEntry.xyz789',
                    folder: { name: 'Campaign' },
                    pages: {
                        contents: [
                            {
                                name: 'Session 1',
                                uuid: 'JournalEntry.xyz789.JournalEntryPage.page1',
                                text: { content: '<p>Session 1 notes</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('Campaign/Session Notes.md');
        });

        it('should generate correct lookup keys for merged files', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc',
                    folder: { name: 'Folder' },
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page1',
                                text: { content: '<p>Content 1</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result[0].lookupKeys).toEqual([
                'Journal',
                'Folder/Journal'
            ]);
        });

        it('should handle journal with no pages', () => {
            const journals = [
                {
                    name: 'Empty Journal',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: { contents: [] }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('');
        });

        it('should handle pages with mixed empty and filled content', () => {
            const journals = [
                {
                    name: 'Mixed Journal',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page1',
                                text: { content: '<p>Content</p>' }
                            },
                            {
                                name: 'Empty Page',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page2',
                                text: { content: '' }
                            },
                            {
                                name: 'Page 3',
                                uuid: 'JournalEntry.abc.JournalEntryPage.page3',
                                text: { content: '<p>More content</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('<p>Content</p>\n\n\n\n<p>More content</p>');
        });

        it('should use journal UUID for foundryPageUuid', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc123',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page',
                                uuid: 'JournalEntry.abc123.JournalEntryPage.page1',
                                text: { content: '<p>Content</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result[0].foundryPageUuid).toBe('JournalEntry.abc123');
        });
    });

    describe('with multiple journals', () => {
        it('should process all journals with merge=false', () => {
            const journals = [
                {
                    name: 'Journal 1',
                    uuid: 'JournalEntry.j1',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.j1.JournalEntryPage.p1',
                                text: { content: '<p>J1 P1</p>' }
                            }
                        ]
                    }
                },
                {
                    name: 'Journal 2',
                    uuid: 'JournalEntry.j2',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.j2.JournalEntryPage.p1',
                                text: { content: '<p>J2 P1</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toHaveLength(2);
            expect(result[0].filePath).toBe('Journal 1/Page 1.md');
            expect(result[1].filePath).toBe('Journal 2/Page 1.md');
        });

        it('should process all journals with merge=true', () => {
            const journals = [
                {
                    name: 'Journal 1',
                    uuid: 'JournalEntry.j1',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.j1.JournalEntryPage.p1',
                                text: { content: '<p>J1 P1</p>' }
                            }
                        ]
                    }
                },
                {
                    name: 'Journal 2',
                    uuid: 'JournalEntry.j2',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.j2.JournalEntryPage.p1',
                                text: { content: '<p>J2 P1</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: true });

            expect(result).toHaveLength(2);
            expect(result[0].filePath).toBe('Journal 1.md');
            expect(result[1].filePath).toBe('Journal 2.md');
        });
    });

    describe('edge cases', () => {
        it('should return empty array for null journals', () => {
            const result = prepareJournalsForExport(null);
            expect(result).toEqual([]);
        });

        it('should return empty array for empty journals array', () => {
            const result = prepareJournalsForExport([]);
            expect(result).toEqual([]);
        });

        it('should default to merge=false when options not provided', () => {
            const journals = [
                {
                    name: 'Journal',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: {
                        contents: [
                            {
                                name: 'Page 1',
                                uuid: 'JournalEntry.abc.JournalEntryPage.p1',
                                text: { content: '<p>Content</p>' }
                            },
                            {
                                name: 'Page 2',
                                uuid: 'JournalEntry.abc.JournalEntryPage.p2',
                                text: { content: '<p>Content 2</p>' }
                            }
                        ]
                    }
                }
            ];

            const result = prepareJournalsForExport(journals);

            expect(result).toHaveLength(2);
        });

        it('should handle journal with no pages property', () => {
            const journals = [
                {
                    name: 'No Pages',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: null
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toEqual([]);
        });

        it('should handle journal with pages but no contents', () => {
            const journals = [
                {
                    name: 'No Contents',
                    uuid: 'JournalEntry.abc',
                    folder: null,
                    pages: { contents: null }
                }
            ];

            const result = prepareJournalsForExport(journals, { merge: false });

            expect(result).toEqual([]);
        });
    });
});
