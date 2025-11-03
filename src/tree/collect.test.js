import { describe, test, expect } from '@jest/globals';
import { collectSelectedPaths, collectSelectedJournals } from './collect.js';

describe('collectSelectedPaths', () => {
    test('returns empty Set for null tree', () => {
        const result = collectSelectedPaths(null);

        expect(result).toBeInstanceOf(Set);
        expect(result.size).toBe(0);
    });

    test('returns empty Set for undefined tree', () => {
        const result = collectSelectedPaths(undefined);

        expect(result).toBeInstanceOf(Set);
        expect(result.size).toBe(0);
    });

    test('returns path of single selected file', () => {
        const tree = {
            name: 'Vault',
            path: '',
            isDirectory: true,
            isSelected: true,
            children: [
                {
                    name: 'note.md',
                    path: 'note.md',
                    isDirectory: false,
                    isSelected: true
                }
            ]
        };

        const result = collectSelectedPaths(tree);

        expect(result.size).toBe(1);
        expect(result.has('note.md')).toBe(true);
    });

    test('excludes unselected files', () => {
        const tree = {
            name: 'Vault',
            path: '',
            isDirectory: true,
            isSelected: false,
            children: [
                {
                    name: 'selected.md',
                    path: 'selected.md',
                    isDirectory: false,
                    isSelected: true
                },
                {
                    name: 'unselected.md',
                    path: 'unselected.md',
                    isDirectory: false,
                    isSelected: false
                }
            ]
        };

        const result = collectSelectedPaths(tree);

        expect(result.size).toBe(1);
        expect(result.has('selected.md')).toBe(true);
        expect(result.has('unselected.md')).toBe(false);
    });

    test('collects paths from nested directories', () => {
        const tree = {
            name: 'Vault',
            path: '',
            isDirectory: true,
            isSelected: true,
            children: [
                {
                    name: 'Folder',
                    path: 'Folder',
                    isDirectory: true,
                    isSelected: true,
                    children: [
                        {
                            name: 'Subfolder',
                            path: 'Folder/Subfolder',
                            isDirectory: true,
                            isSelected: true,
                            children: [
                                {
                                    name: 'deep.md',
                                    path: 'Folder/Subfolder/deep.md',
                                    isDirectory: false,
                                    isSelected: true
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = collectSelectedPaths(tree);

        expect(result.size).toBe(1);
        expect(result.has('Folder/Subfolder/deep.md')).toBe(true);
    });

    test('does not include directory paths, only file paths', () => {
        const tree = {
            name: 'Vault',
            path: '',
            isDirectory: true,
            isSelected: true,
            children: [
                {
                    name: 'Folder',
                    path: 'Folder',
                    isDirectory: true,
                    isSelected: true,
                    children: [
                        {
                            name: 'file.md',
                            path: 'Folder/file.md',
                            isDirectory: false,
                            isSelected: true
                        }
                    ]
                }
            ]
        };

        const result = collectSelectedPaths(tree);

        expect(result.size).toBe(1);
        expect(result.has('Folder/file.md')).toBe(true);
        expect(result.has('Folder')).toBe(false);
    });

    test('handles mixed selection in multiple folders', () => {
        const tree = {
            name: 'Vault',
            path: '',
            isDirectory: true,
            isSelected: false,
            children: [
                {
                    name: 'Folder1',
                    path: 'Folder1',
                    isDirectory: true,
                    isSelected: true,
                    children: [
                        {
                            name: 'file1.md',
                            path: 'Folder1/file1.md',
                            isDirectory: false,
                            isSelected: true
                        },
                        {
                            name: 'file2.md',
                            path: 'Folder1/file2.md',
                            isDirectory: false,
                            isSelected: false
                        }
                    ]
                },
                {
                    name: 'Folder2',
                    path: 'Folder2',
                    isDirectory: true,
                    isSelected: true,
                    children: [
                        {
                            name: 'file3.md',
                            path: 'Folder2/file3.md',
                            isDirectory: false,
                            isSelected: true
                        }
                    ]
                }
            ]
        };

        const result = collectSelectedPaths(tree);

        expect(result.size).toBe(2);
        expect(result.has('Folder1/file1.md')).toBe(true);
        expect(result.has('Folder1/file2.md')).toBe(false);
        expect(result.has('Folder2/file3.md')).toBe(true);
    });

    test('returns all paths when everything is selected', () => {
        const tree = {
            name: 'Vault',
            path: '',
            isDirectory: true,
            isSelected: true,
            children: [
                {
                    name: 'file1.md',
                    path: 'file1.md',
                    isDirectory: false,
                    isSelected: true
                },
                {
                    name: 'file2.md',
                    path: 'file2.md',
                    isDirectory: false,
                    isSelected: true
                },
                {
                    name: 'file3.md',
                    path: 'file3.md',
                    isDirectory: false,
                    isSelected: true
                }
            ]
        };

        const result = collectSelectedPaths(tree);

        expect(result.size).toBe(3);
        expect(result.has('file1.md')).toBe(true);
        expect(result.has('file2.md')).toBe(true);
        expect(result.has('file3.md')).toBe(true);
    });
});

describe('collectSelectedJournals', () => {
    test('returns empty array for null tree', () => {
        const result = collectSelectedJournals(null);

        expect(result).toEqual([]);
    });

    test('returns empty array for undefined tree', () => {
        const result = collectSelectedJournals(undefined);

        expect(result).toEqual([]);
    });

    test('returns document of single selected journal', () => {
        const mockDoc = { id: 'j1', name: 'Journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: true,
            children: [
                {
                    id: 'j1',
                    name: 'Journal',
                    type: 'journal',
                    isSelected: true,
                    document: mockDoc
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(1);
        expect(result[0]).toBe(mockDoc);
    });

    test('excludes unselected journals', () => {
        const selectedDoc = { id: 'j1', name: 'Selected' };
        const unselectedDoc = { id: 'j2', name: 'Unselected' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: false,
            children: [
                {
                    id: 'j1',
                    name: 'Selected',
                    type: 'journal',
                    isSelected: true,
                    document: selectedDoc
                },
                {
                    id: 'j2',
                    name: 'Unselected',
                    type: 'journal',
                    isSelected: false,
                    document: unselectedDoc
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(1);
        expect(result[0]).toBe(selectedDoc);
    });

    test('collects journals from nested folders', () => {
        const deepDoc = { id: 'j1', name: 'Deep Journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: true,
            children: [
                {
                    id: 'f1',
                    name: 'Folder',
                    type: 'folder',
                    isSelected: true,
                    children: [
                        {
                            id: 'f2',
                            name: 'Subfolder',
                            type: 'folder',
                            isSelected: true,
                            children: [
                                {
                                    id: 'j1',
                                    name: 'Deep Journal',
                                    type: 'journal',
                                    isSelected: true,
                                    document: deepDoc
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(1);
        expect(result[0]).toBe(deepDoc);
    });

    test('does not include folder nodes, only journal documents', () => {
        const journalDoc = { id: 'j1', name: 'Journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: true,
            children: [
                {
                    id: 'f1',
                    name: 'Folder',
                    type: 'folder',
                    isSelected: true,
                    children: [
                        {
                            id: 'j1',
                            name: 'Journal',
                            type: 'journal',
                            isSelected: true,
                            document: journalDoc
                        }
                    ]
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(1);
        expect(result[0]).toBe(journalDoc);
    });

    test('handles mixed selection in multiple folders', () => {
        const doc1 = { id: 'j1', name: 'Journal 1' };
        const doc3 = { id: 'j3', name: 'Journal 3' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: false,
            children: [
                {
                    id: 'f1',
                    name: 'Folder1',
                    type: 'folder',
                    isSelected: true,
                    children: [
                        {
                            id: 'j1',
                            name: 'Journal 1',
                            type: 'journal',
                            isSelected: true,
                            document: doc1
                        },
                        {
                            id: 'j2',
                            name: 'Journal 2',
                            type: 'journal',
                            isSelected: false,
                            document: { id: 'j2', name: 'Journal 2' }
                        }
                    ]
                },
                {
                    id: 'f2',
                    name: 'Folder2',
                    type: 'folder',
                    isSelected: true,
                    children: [
                        {
                            id: 'j3',
                            name: 'Journal 3',
                            type: 'journal',
                            isSelected: true,
                            document: doc3
                        }
                    ]
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(2);
        expect(result).toContain(doc1);
        expect(result).toContain(doc3);
    });

    test('returns all documents when everything is selected', () => {
        const doc1 = { id: 'j1', name: 'Journal 1' };
        const doc2 = { id: 'j2', name: 'Journal 2' };
        const doc3 = { id: 'j3', name: 'Journal 3' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: true,
            children: [
                {
                    id: 'j1',
                    name: 'Journal 1',
                    type: 'journal',
                    isSelected: true,
                    document: doc1
                },
                {
                    id: 'j2',
                    name: 'Journal 2',
                    type: 'journal',
                    isSelected: true,
                    document: doc2
                },
                {
                    id: 'j3',
                    name: 'Journal 3',
                    type: 'journal',
                    isSelected: true,
                    document: doc3
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(3);
        expect(result).toContain(doc1);
        expect(result).toContain(doc2);
        expect(result).toContain(doc3);
    });

    test('skips journal nodes without document property', () => {
        const doc1 = { id: 'j1', name: 'Journal 1' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            isSelected: true,
            children: [
                {
                    id: 'j1',
                    name: 'Journal 1',
                    type: 'journal',
                    isSelected: true,
                    document: doc1
                },
                {
                    id: 'j2',
                    name: 'Journal 2',
                    type: 'journal',
                    isSelected: true
                }
            ]
        };

        const result = collectSelectedJournals(tree);

        expect(result.length).toBe(1);
        expect(result[0]).toBe(doc1);
    });
});
