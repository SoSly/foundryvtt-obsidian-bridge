import { findNodeByPath, findNodeById } from './find';

describe('findNodeByPath', () => {
    test('returns null when node is null', () => {
        const result = findNodeByPath(null, 'any/path');

        expect(result).toBeNull();
    });

    test('returns null when node is undefined', () => {
        const result = findNodeByPath(undefined, 'any/path');

        expect(result).toBeNull();
    });

    test('finds root node by path', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: []
        };

        const result = findNodeByPath(tree, 'root');

        expect(result).toBe(tree);
    });

    test('finds direct child by path', () => {
        const child = { path: 'root/child', name: 'child', isDirectory: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [child]
        };

        const result = findNodeByPath(tree, 'root/child');

        expect(result).toBe(child);
    });

    test('finds deeply nested node by path', () => {
        const deepNode = { path: 'a/b/c/d', name: 'd', isDirectory: false };
        const tree = {
            path: 'a',
            name: 'a',
            isDirectory: true,
            children: [
                {
                    path: 'a/b',
                    name: 'b',
                    isDirectory: true,
                    children: [
                        {
                            path: 'a/b/c',
                            name: 'c',
                            isDirectory: true,
                            children: [deepNode]
                        }
                    ]
                }
            ]
        };

        const result = findNodeByPath(tree, 'a/b/c/d');

        expect(result).toBe(deepNode);
    });

    test('returns null when path does not exist', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [
                { path: 'root/child1', name: 'child1', isDirectory: false }
            ]
        };

        const result = findNodeByPath(tree, 'root/nonexistent');

        expect(result).toBeNull();
    });

    test('searches across multiple branches', () => {
        const targetNode = { path: 'root/branch2/file', name: 'file', isDirectory: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [
                {
                    path: 'root/branch1',
                    name: 'branch1',
                    isDirectory: true,
                    children: [
                        { path: 'root/branch1/file1', name: 'file1', isDirectory: false }
                    ]
                },
                {
                    path: 'root/branch2',
                    name: 'branch2',
                    isDirectory: true,
                    children: [targetNode]
                }
            ]
        };

        const result = findNodeByPath(tree, 'root/branch2/file');

        expect(result).toBe(targetNode);
    });

    test('handles file nodes without children', () => {
        const fileNode = { path: 'root/file.md', name: 'file.md', isDirectory: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [fileNode]
        };

        const result = findNodeByPath(tree, 'root/file.md');

        expect(result).toBe(fileNode);
    });

    test('handles empty directory', () => {
        const emptyDir = {
            path: 'root/empty',
            name: 'empty',
            isDirectory: true,
            children: []
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [emptyDir]
        };

        const result = findNodeByPath(tree, 'root/empty');

        expect(result).toBe(emptyDir);
    });
});

describe('findNodeById', () => {
    test('returns null when node is null', () => {
        const result = findNodeById(null, 'any-id');

        expect(result).toBeNull();
    });

    test('returns null when node is undefined', () => {
        const result = findNodeById(undefined, 'any-id');

        expect(result).toBeNull();
    });

    test('finds root node by id', () => {
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: []
        };

        const result = findNodeById(tree, 'root');

        expect(result).toBe(tree);
    });

    test('finds direct child by id', () => {
        const child = { id: 'j1', name: 'Journal', type: 'journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: [child]
        };

        const result = findNodeById(tree, 'j1');

        expect(result).toBe(child);
    });

    test('finds deeply nested node by id', () => {
        const deepNode = { id: 'j1', name: 'Deep Journal', type: 'journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: [
                {
                    id: 'f1',
                    name: 'Folder 1',
                    type: 'folder',
                    children: [
                        {
                            id: 'f2',
                            name: 'Folder 2',
                            type: 'folder',
                            children: [deepNode]
                        }
                    ]
                }
            ]
        };

        const result = findNodeById(tree, 'j1');

        expect(result).toBe(deepNode);
    });

    test('returns null when id does not exist', () => {
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: [
                { id: 'j1', name: 'Journal 1', type: 'journal' }
            ]
        };

        const result = findNodeById(tree, 'nonexistent');

        expect(result).toBeNull();
    });

    test('searches across multiple branches', () => {
        const targetNode = { id: 'j2', name: 'Target Journal', type: 'journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: [
                {
                    id: 'f1',
                    name: 'Branch 1',
                    type: 'folder',
                    children: [
                        { id: 'j1', name: 'Journal 1', type: 'journal' }
                    ]
                },
                {
                    id: 'f2',
                    name: 'Branch 2',
                    type: 'folder',
                    children: [targetNode]
                }
            ]
        };

        const result = findNodeById(tree, 'j2');

        expect(result).toBe(targetNode);
    });

    test('handles journal nodes without children', () => {
        const journalNode = { id: 'j1', name: 'Journal', type: 'journal' };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: [journalNode]
        };

        const result = findNodeById(tree, 'j1');

        expect(result).toBe(journalNode);
    });

    test('handles empty folder', () => {
        const emptyFolder = {
            id: 'f1',
            name: 'Empty',
            type: 'folder',
            children: []
        };
        const tree = {
            id: 'root',
            name: 'Journals',
            type: 'folder',
            children: [emptyFolder]
        };

        const result = findNodeById(tree, 'f1');

        expect(result).toBe(emptyFolder);
    });
});
