import { describe, test, expect } from '@jest/globals';
import { collectSelectedPaths } from './collectSelectedPaths.js';

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
