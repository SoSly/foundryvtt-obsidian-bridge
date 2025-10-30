import { describe, test, expect } from '@jest/globals';
import { buildFileTree } from './buildFileTree.js';
import VaultTreeNode from '../../domain/VaultTreeNode.js';

function createMockFile(path, name) {
    return {
        name,
        webkitRelativePath: path,
        type: name.endsWith('.md') ? 'text/markdown' : 'image/png',
        size: 100
    };
}

function createMockFileList(files) {
    const fileList = files.map(f => createMockFile(f.path, f.name));
    fileList.item = index => fileList[index];
    return fileList;
}

describe('buildFileTree', () => {
    test('returns null for empty FileList', () => {
        const fileList = createMockFileList([]);
        const tree = buildFileTree(fileList);

        expect(tree).toBeNull();
    });

    test('creates tree with single markdown file at vault root', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/note.md', name: 'note.md' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree).not.toBeNull();
        expect(tree.name).toBe('MyVault');
        expect(tree.isDirectory).toBe(true);
        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('note.md');
        expect(tree.children[0].isDirectory).toBe(false);
    });

    test('creates nested directory structure', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/Subfolder/note.md', name: 'note.md' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.name).toBe('MyVault');
        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('Folder');
        expect(tree.children[0].isDirectory).toBe(true);
        expect(tree.children[0].children).toHaveLength(1);
        expect(tree.children[0].children[0].name).toBe('Subfolder');
        expect(tree.children[0].children[0].children).toHaveLength(1);
        expect(tree.children[0].children[0].children[0].name).toBe('note.md');
    });

    test('groups multiple files in same directory', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/note1.md', name: 'note1.md' },
            { path: 'MyVault/Folder/note2.md', name: 'note2.md' },
            { path: 'MyVault/Folder/image.png', name: 'image.png' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('Folder');
        expect(tree.children[0].children).toHaveLength(2);

        const childNames = tree.children[0].children.map(c => c.name).sort();
        expect(childNames).toEqual(['note1.md', 'note2.md']);
    });

    test('excludes directories with no markdown files anywhere in subtree', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Notes/note.md', name: 'note.md' },
            { path: 'MyVault/Images/photo.png', name: 'photo.png' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('Notes');
    });

    test('excludes non-markdown files even if their directory contains markdown files', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/note.md', name: 'note.md' },
            { path: 'MyVault/Folder/image1.png', name: 'image1.png' },
            { path: 'MyVault/Folder/image2.png', name: 'image2.png' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.children[0].children).toHaveLength(1);
        expect(tree.children[0].children[0].name).toBe('note.md');
        expect(tree.children[0].children[0].isDirectory).toBe(false);
    });

    test('includes parent directories if child directories contain markdown files', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Parent/Child/note.md', name: 'note.md' },
            { path: 'MyVault/Parent/image.png', name: 'image.png' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('Parent');
        expect(tree.children[0].children).toHaveLength(1);

        const childFolder = tree.children[0].children.find(c => c.name === 'Child');
        expect(childFolder).toBeDefined();
        expect(childFolder.children).toHaveLength(1);
        expect(childFolder.children[0].name).toBe('note.md');
    });

    test('handles complex mixed directory structure', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Notes/Work/project.md', name: 'project.md' },
            { path: 'MyVault/Notes/Personal/journal.md', name: 'journal.md' },
            { path: 'MyVault/Images/photo.png', name: 'photo.png' },
            { path: 'MyVault/Templates/template.md', name: 'template.md' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.children).toHaveLength(2);

        const folderNames = tree.children.map(c => c.name).sort();
        expect(folderNames).toEqual(['Notes', 'Templates']);
    });

    test('preserves file paths in tree nodes', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/note.md', name: 'note.md' }
        ]);
        const tree = buildFileTree(fileList);

        const file = tree.children[0].children[0];
        expect(file.path).toBe('Folder/note.md');
    });

    test('marks all nodes as selected by default', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/note.md', name: 'note.md' }
        ]);
        const tree = buildFileTree(fileList);

        expect(tree.isSelected).toBe(true);
        expect(tree.children[0].isSelected).toBe(true);
        expect(tree.children[0].children[0].isSelected).toBe(true);
    });

    test('VaultTreeNode rejects non-markdown files', () => {
        expect(() => {
            new VaultTreeNode({
                name: 'image.png',
                path: 'Images/image.png',
                isDirectory: false,
                isSelected: true
            });
        }).toThrow('VaultTreeNode can only represent directories or markdown files');
    });

    test('VaultTreeNode allows markdown files', () => {
        expect(() => {
            new VaultTreeNode({
                name: 'note.md',
                path: 'Notes/note.md',
                isDirectory: false,
                isSelected: true
            });
        }).not.toThrow();
    });

    test('VaultTreeNode allows directories', () => {
        expect(() => {
            new VaultTreeNode({
                name: 'Folder',
                path: 'Folder',
                isDirectory: true,
                isSelected: true,
                children: []
            });
        }).not.toThrow();
    });
});
