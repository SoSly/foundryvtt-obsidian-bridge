import { describe, it, expect } from '@jest/globals';
import prepareFilesForImport from './prepare.js';
import MarkdownFile from '../domain/MarkdownFile.js';

function createMockFile(relativePath, content) {
    return {
        webkitRelativePath: relativePath,
        text: async () => content
    };
}

describe('prepareFilesForImport', () => {
    it('should create MarkdownFile from browser File', async () => {
        const files = [
            createMockFile('vault/notes/My Note.md', '# My Note\n\nContent here')
        ];

        const result = await prepareFilesForImport(files);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(MarkdownFile);
        expect(result[0].filePath).toBe('vault/notes/My Note.md');
        expect(result[0].content).toBe('# My Note\n\nContent here');
        expect(result[0].links).toEqual([]);
        expect(result[0].assets).toEqual([]);
        expect(result[0].foundryPageUuid).toBeNull();
    });

    it('should generate lookup keys from file path', async () => {
        const files = [
            createMockFile('vault/campaign/npcs/Bob.md', 'NPC notes')
        ];

        const result = await prepareFilesForImport(files);

        expect(result[0].lookupKeys).toEqual([
            'Bob',
            'npcs/Bob',
            'campaign/npcs/Bob',
            'vault/campaign/npcs/Bob'
        ]);
    });

    it('should process multiple files', async () => {
        const files = [
            createMockFile('vault/note1.md', 'Content 1'),
            createMockFile('vault/note2.md', 'Content 2'),
            createMockFile('vault/folder/note3.md', 'Content 3')
        ];

        const result = await prepareFilesForImport(files);

        expect(result).toHaveLength(3);
        expect(result[0].filePath).toBe('vault/note1.md');
        expect(result[0].content).toBe('Content 1');
        expect(result[1].filePath).toBe('vault/note2.md');
        expect(result[1].content).toBe('Content 2');
        expect(result[2].filePath).toBe('vault/folder/note3.md');
        expect(result[2].content).toBe('Content 3');
    });

    it('should handle empty file content', async () => {
        const files = [
            createMockFile('vault/empty.md', '')
        ];

        const result = await prepareFilesForImport(files);

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('');
    });

    it('should handle file at root of vault', async () => {
        const files = [
            createMockFile('note.md', 'Root note')
        ];

        const result = await prepareFilesForImport(files);

        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe('note.md');
        expect(result[0].lookupKeys).toEqual(['note']);
    });

    it('should handle files with special characters in path', async () => {
        const files = [
            createMockFile('vault/My Folder/My Note (Draft).md', 'Draft content')
        ];

        const result = await prepareFilesForImport(files);

        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe('vault/My Folder/My Note (Draft).md');
        expect(result[0].content).toBe('Draft content');
    });

    it('should handle deeply nested paths', async () => {
        const files = [
            createMockFile('vault/a/b/c/d/e/deep.md', 'Deep file')
        ];

        const result = await prepareFilesForImport(files);

        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe('vault/a/b/c/d/e/deep.md');
        expect(result[0].lookupKeys).toEqual([
            'deep',
            'e/deep',
            'd/e/deep',
            'c/d/e/deep',
            'b/c/d/e/deep',
            'a/b/c/d/e/deep',
            'vault/a/b/c/d/e/deep'
        ]);
    });

    it('should initialize empty links and assets arrays', async () => {
        const files = [
            createMockFile('vault/note.md', 'Content')
        ];

        const result = await prepareFilesForImport(files);

        expect(result[0].links).toEqual([]);
        expect(result[0].assets).toEqual([]);
        expect(Array.isArray(result[0].links)).toBe(true);
        expect(Array.isArray(result[0].assets)).toBe(true);
    });

    it('should set foundryPageUuid to null', async () => {
        const files = [
            createMockFile('vault/note.md', 'Content')
        ];

        const result = await prepareFilesForImport(files);

        expect(result[0].foundryPageUuid).toBeNull();
    });

    describe('edge cases', () => {
        it('should return empty array for null files', async () => {
            const result = await prepareFilesForImport(null);
            expect(result).toEqual([]);
        });

        it('should return empty array for undefined files', async () => {
            const result = await prepareFilesForImport(undefined);
            expect(result).toEqual([]);
        });

        it('should return empty array for empty files array', async () => {
            const result = await prepareFilesForImport([]);
            expect(result).toEqual([]);
        });

        it('should handle markdown content with unicode characters', async () => {
            const files = [
                createMockFile('vault/unicode.md', '# 日本語\n\n🎮 Content with émojis and àccènts')
            ];

            const result = await prepareFilesForImport(files);

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('# 日本語\n\n🎮 Content with émojis and àccènts');
        });

        it('should handle large file content', async () => {
            const largeContent = 'x'.repeat(100000);
            const files = [
                createMockFile('vault/large.md', largeContent)
            ];

            const result = await prepareFilesForImport(files);

            expect(result).toHaveLength(1);
            expect(result[0].content.length).toBe(100000);
        });

        it('should handle files with Windows-style paths', async () => {
            const files = [
                createMockFile('vault\\windows\\path\\note.md', 'Windows path')
            ];

            const result = await prepareFilesForImport(files);

            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('vault\\windows\\path\\note.md');
        });
    });

    describe('async processing', () => {
        it('should await file.text() for each file', async () => {
            let textCallCount = 0;
            const files = [
                {
                    webkitRelativePath: 'vault/file1.md',
                    text: async () => {
                        textCallCount++;
                        return 'Content 1';
                    }
                },
                {
                    webkitRelativePath: 'vault/file2.md',
                    text: async () => {
                        textCallCount++;
                        return 'Content 2';
                    }
                }
            ];

            const result = await prepareFilesForImport(files);

            expect(textCallCount).toBe(2);
            expect(result).toHaveLength(2);
        });

        it('should process files sequentially', async () => {
            const processingOrder = [];
            const files = [
                {
                    webkitRelativePath: 'vault/file1.md',
                    text: async () => {
                        processingOrder.push(1);
                        return 'Content 1';
                    }
                },
                {
                    webkitRelativePath: 'vault/file2.md',
                    text: async () => {
                        processingOrder.push(2);
                        return 'Content 2';
                    }
                }
            ];

            await prepareFilesForImport(files);

            expect(processingOrder).toEqual([1, 2]);
        });
    });
});
