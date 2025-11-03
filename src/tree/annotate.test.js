import { annotateTreeForDisplay } from './annotate';

describe('annotateTreeForDisplay', () => {
    test('returns null when node is null', () => {
        const result = annotateTreeForDisplay(null);

        expect(result).toBeNull();
    });

    test('returns null when node is undefined', () => {
        const result = annotateTreeForDisplay(undefined);

        expect(result).toBeNull();
    });

    test('annotates root node with empty tree char', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: []
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.isRoot).toBe(true);
        expect(result.treeChar).toBe('');
        expect(result.path).toBe('root');
        expect(result.name).toBe('root');
    });

    test('annotates last child with └─ character', () => {
        const child = {
            path: 'root/child.md',
            name: 'child.md',
            isDirectory: false
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [child]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children[0].isRoot).toBe(false);
        expect(result.children[0].treeChar).toBe('└─ ');
    });

    test('annotates non-last child with ├─ character', () => {
        const child1 = {
            path: 'root/child1.md',
            name: 'child1.md',
            isDirectory: false
        };
        const child2 = {
            path: 'root/child2.md',
            name: 'child2.md',
            isDirectory: false
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [child1, child2]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children[0].treeChar).toBe('├─ ');
        expect(result.children[1].treeChar).toBe('└─ ');
    });

    test('filters out non-markdown files', () => {
        const mdFile = { path: 'root/note.md', name: 'note.md', isDirectory: false };
        const txtFile = { path: 'root/readme.txt', name: 'readme.txt', isDirectory: false };
        const pngFile = { path: 'root/image.png', name: 'image.png', isDirectory: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [mdFile, txtFile, pngFile]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children.length).toBe(1);
        expect(result.children[0].name).toBe('note.md');
    });

    test('keeps directories regardless of extension', () => {
        const dir = { path: 'root/folder', name: 'folder', isDirectory: true, children: [] };
        const txtFile = { path: 'root/readme.txt', name: 'readme.txt', isDirectory: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [dir, txtFile]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children.length).toBe(1);
        expect(result.children[0].name).toBe('folder');
        expect(result.children[0].isDirectory).toBe(true);
    });

    test('recursively annotates nested structure', () => {
        const deepFile = { path: 'root/mid/deep.md', name: 'deep.md', isDirectory: false };
        const midDir = {
            path: 'root/mid',
            name: 'mid',
            isDirectory: true,
            children: [deepFile]
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [midDir]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children[0].treeChar).toBe('└─ ');
        expect(result.children[0].children[0].treeChar).toBe('└─ ');
        expect(result.children[0].children[0].name).toBe('deep.md');
    });

    test('updates isLast based on filtered children', () => {
        const dir = { path: 'root/folder', name: 'folder', isDirectory: true, children: [] };
        const txtFile = { path: 'root/skip.txt', name: 'skip.txt', isDirectory: false };
        const mdFile = { path: 'root/note.md', name: 'note.md', isDirectory: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [dir, txtFile, mdFile]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children.length).toBe(2);
        expect(result.children[0].name).toBe('folder');
        expect(result.children[0].treeChar).toBe('├─ ');
        expect(result.children[1].name).toBe('note.md');
        expect(result.children[1].treeChar).toBe('└─ ');
    });

    test('preserves original node properties', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: true,
            customProperty: 'test',
            children: []
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.path).toBe('root');
        expect(result.name).toBe('root');
        expect(result.isDirectory).toBe(true);
        expect(result.isSelected).toBe(true);
        expect(result.customProperty).toBe('test');
    });

    test('handles file nodes without children property', () => {
        const fileNode = {
            path: 'root/file.md',
            name: 'file.md',
            isDirectory: false
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            children: [fileNode]
        };

        const result = annotateTreeForDisplay(tree);

        expect(result.children[0].name).toBe('file.md');
        expect(result.children[0].children).toBeUndefined();
    });
});
