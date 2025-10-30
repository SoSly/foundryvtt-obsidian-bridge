import { collectUniqueAssetPaths } from './collectUniqueAssetPaths';
import MarkdownFile from '../../domain/MarkdownFile';

describe('collectUniqueAssetPaths', () => {
    test('returns empty set when no markdown files', () => {
        const result = collectUniqueAssetPaths([]);

        expect(result).toBeInstanceOf(Set);
        expect(result.size).toBe(0);
    });

    test('returns empty set when markdown files have no assets', () => {
        const file1 = new MarkdownFile({ filePath: 'test1.md' });
        const file2 = new MarkdownFile({ filePath: 'test2.md' });

        const result = collectUniqueAssetPaths([file1, file2]);

        expect(result.size).toBe(0);
    });

    test('collects unique asset paths from single file', () => {
        const file = new MarkdownFile({ filePath: 'test.md' });
        file.assets = [
            { obsidianPath: 'images/pic1.png' },
            { obsidianPath: 'images/pic2.png' }
        ];

        const result = collectUniqueAssetPaths([file]);

        expect(result.size).toBe(2);
        expect(result.has('images/pic1.png')).toBe(true);
        expect(result.has('images/pic2.png')).toBe(true);
    });

    test('deduplicates asset paths across multiple files', () => {
        const file1 = new MarkdownFile({ filePath: 'test1.md' });
        file1.assets = [
            { obsidianPath: 'images/shared.png' },
            { obsidianPath: 'images/pic1.png' }
        ];

        const file2 = new MarkdownFile({ filePath: 'test2.md' });
        file2.assets = [
            { obsidianPath: 'images/shared.png' },
            { obsidianPath: 'images/pic2.png' }
        ];

        const result = collectUniqueAssetPaths([file1, file2]);

        expect(result.size).toBe(3);
        expect(result.has('images/shared.png')).toBe(true);
        expect(result.has('images/pic1.png')).toBe(true);
        expect(result.has('images/pic2.png')).toBe(true);
    });

    test('handles complex nested paths', () => {
        const file = new MarkdownFile({ filePath: 'notes/test.md' });
        file.assets = [
            { obsidianPath: 'assets/images/subfolder/deep/pic.png' },
            { obsidianPath: 'docs/pdfs/manual.pdf' }
        ];

        const result = collectUniqueAssetPaths([file]);

        expect(result.size).toBe(2);
        expect(result.has('assets/images/subfolder/deep/pic.png')).toBe(true);
        expect(result.has('docs/pdfs/manual.pdf')).toBe(true);
    });
});
