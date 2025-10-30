import { describe, test, expect } from '@jest/globals';
import { filterFilesBySelection } from './filterFilesBySelection.js';

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

describe('filterFilesBySelection', () => {
    test('returns empty array when selectedPaths is empty', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/note.md', name: 'note.md' }
        ]);
        const selectedPaths = new Set();

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toEqual([]);
    });

    test('returns all files when all paths are selected', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/note1.md', name: 'note1.md' },
            { path: 'MyVault/note2.md', name: 'note2.md' }
        ]);
        const selectedPaths = new Set(['note1.md', 'note2.md']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('note1.md');
        expect(result[1].name).toBe('note2.md');
    });

    test('filters out unselected files', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/note1.md', name: 'note1.md' },
            { path: 'MyVault/note2.md', name: 'note2.md' },
            { path: 'MyVault/note3.md', name: 'note3.md' }
        ]);
        const selectedPaths = new Set(['note1.md', 'note3.md']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('note1.md');
        expect(result[1].name).toBe('note3.md');
    });

    test('handles nested file paths correctly', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/Subfolder/note.md', name: 'note.md' },
            { path: 'MyVault/Folder/other.md', name: 'other.md' }
        ]);
        const selectedPaths = new Set(['Folder/Subfolder/note.md']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('note.md');
        expect(result[0].webkitRelativePath).toBe('MyVault/Folder/Subfolder/note.md');
    });

    test('includes all files in selected folder', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder/note.md', name: 'note.md' },
            { path: 'MyVault/Folder/image.png', name: 'image.png' },
            { path: 'MyVault/Other/file.md', name: 'file.md' }
        ]);
        const selectedPaths = new Set(['Folder/note.md', 'Folder/image.png']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toHaveLength(2);
        const names = result.map(f => f.name).sort();
        expect(names).toEqual(['image.png', 'note.md']);
    });

    test('preserves file objects exactly as they were', () => {
        const mockFile = createMockFile('MyVault/note.md', 'note.md');
        const fileList = [mockFile];
        fileList.item = index => fileList[index];
        const selectedPaths = new Set(['note.md']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result[0]).toBe(mockFile);
    });

    test('returns empty array for empty FileList', () => {
        const fileList = createMockFileList([]);
        const selectedPaths = new Set(['note.md']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toEqual([]);
    });

    test('handles mixed selection across multiple folders', () => {
        const fileList = createMockFileList([
            { path: 'MyVault/Folder1/note1.md', name: 'note1.md' },
            { path: 'MyVault/Folder1/note2.md', name: 'note2.md' },
            { path: 'MyVault/Folder2/note3.md', name: 'note3.md' },
            { path: 'MyVault/Folder2/note4.md', name: 'note4.md' }
        ]);
        const selectedPaths = new Set(['Folder1/note1.md', 'Folder2/note4.md']);

        const result = filterFilesBySelection(fileList, selectedPaths);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('note1.md');
        expect(result[1].name).toBe('note4.md');
    });
});
