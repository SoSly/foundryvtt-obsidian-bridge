import { describe, test, expect, beforeEach } from '@jest/globals';
import { buildFileTree, buildJournalTree } from './build';
import VaultTreeNode from '../domain/VaultTreeNode';
import JournalTreeNode from '../domain/JournalTreeNode';

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

describe('buildJournalTree', () => {
    beforeEach(() => {
        global.game = {
            folders: new Map(),
            journal: new Map()
        };
    });

    test('returns null when no journals exist', () => {
        const tree = buildJournalTree();

        expect(tree).toBeNull();
    });

    test('creates tree with single journal at root', () => {
        const mockJournal = { id: 'j1', name: 'My Journal', folder: null };
        global.game.journal.set('j1', mockJournal);

        const tree = buildJournalTree();

        expect(tree).not.toBeNull();
        expect(tree.name).toBe('Journals');
        expect(tree.type).toBe('folder');
        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('My Journal');
        expect(tree.children[0].type).toBe('journal');
        expect(tree.children[0].document).toBe(mockJournal);
    });

    test('creates nested folder structure', () => {
        const parentFolder = { id: 'f1', name: 'Parent', type: 'JournalEntry', folder: null };
        const childFolder = { id: 'f2', name: 'Child', type: 'JournalEntry', folder: parentFolder };
        const mockJournal = { id: 'j1', name: 'My Journal', folder: childFolder };

        global.game.folders.set('f1', parentFolder);
        global.game.folders.set('f2', childFolder);
        global.game.journal.set('j1', mockJournal);

        const tree = buildJournalTree();

        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('Parent');
        expect(tree.children[0].children).toHaveLength(1);
        expect(tree.children[0].children[0].name).toBe('Child');
        expect(tree.children[0].children[0].children).toHaveLength(1);
        expect(tree.children[0].children[0].children[0].name).toBe('My Journal');
    });

    test('groups multiple journals in same folder', () => {
        const folder = { id: 'f1', name: 'NPCs', type: 'JournalEntry', folder: null };
        const journal1 = { id: 'j1', name: 'Alice', folder };
        const journal2 = { id: 'j2', name: 'Bob', folder };

        global.game.folders.set('f1', folder);
        global.game.journal.set('j1', journal1);
        global.game.journal.set('j2', journal2);

        const tree = buildJournalTree();

        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('NPCs');
        expect(tree.children[0].children).toHaveLength(2);

        const childNames = tree.children[0].children.map(c => c.name).sort();
        expect(childNames).toEqual(['Alice', 'Bob']);
    });

    test('sorts folders before journals', () => {
        const folder = { id: 'f1', name: 'Folder', type: 'JournalEntry', folder: null };
        const journal = { id: 'j1', name: 'Journal', folder: null };

        global.game.folders.set('f1', folder);
        global.game.journal.set('j1', journal);

        const tree = buildJournalTree();

        expect(tree.children).toHaveLength(2);
        expect(tree.children[0].type).toBe('folder');
        expect(tree.children[1].type).toBe('journal');
    });

    test('sorts items alphabetically within same type', () => {
        const journal1 = { id: 'j1', name: 'Zebra', folder: null };
        const journal2 = { id: 'j2', name: 'Alpha', folder: null };
        const journal3 = { id: 'j3', name: 'Bravo', folder: null };

        global.game.journal.set('j1', journal1);
        global.game.journal.set('j2', journal2);
        global.game.journal.set('j3', journal3);

        const tree = buildJournalTree();

        const names = tree.children.map(c => c.name);
        expect(names).toEqual(['Alpha', 'Bravo', 'Zebra']);
    });

    test('ignores non-JournalEntry folders', () => {
        const journalFolder = { id: 'f1', name: 'Journals', type: 'JournalEntry', folder: null };
        const sceneFolder = { id: 'f2', name: 'Scenes', type: 'Scene', folder: null };

        global.game.folders.set('f1', journalFolder);
        global.game.folders.set('f2', sceneFolder);

        const tree = buildJournalTree();

        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].name).toBe('Journals');
    });

    test('marks all nodes as selected by default', () => {
        const folder = { id: 'f1', name: 'NPCs', type: 'JournalEntry', folder: null };
        const journal = { id: 'j1', name: 'Alice', folder };

        global.game.folders.set('f1', folder);
        global.game.journal.set('j1', journal);

        const tree = buildJournalTree();

        expect(tree.isSelected).toBe(true);
        expect(tree.children[0].isSelected).toBe(true);
        expect(tree.children[0].children[0].isSelected).toBe(true);
    });

    test('JournalTreeNode requires id', () => {
        expect(() => {
            new JournalTreeNode({
                name: 'Test',
                type: 'journal'
            });
        }).toThrow('JournalTreeNode requires id');
    });

    test('JournalTreeNode requires name', () => {
        expect(() => {
            new JournalTreeNode({
                id: 'test',
                type: 'journal'
            });
        }).toThrow('JournalTreeNode requires name');
    });

    test('JournalTreeNode requires valid type', () => {
        expect(() => {
            new JournalTreeNode({
                id: 'test',
                name: 'Test',
                type: 'invalid'
            });
        }).toThrow("JournalTreeNode type must be 'journal' or 'folder'");
    });

    test('JournalTreeNode allows journal type', () => {
        expect(() => {
            new JournalTreeNode({
                id: 'test',
                name: 'Test',
                type: 'journal'
            });
        }).not.toThrow();
    });

    test('JournalTreeNode allows folder type', () => {
        expect(() => {
            new JournalTreeNode({
                id: 'test',
                name: 'Test',
                type: 'folder'
            });
        }).not.toThrow();
    });
});
