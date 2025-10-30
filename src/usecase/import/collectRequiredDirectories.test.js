import { collectRequiredDirectories } from './collectRequiredDirectories';

describe('collectRequiredDirectories', () => {
    test('returns base path only when asset paths are empty', () => {
        const result = collectRequiredDirectories([], 'data/vault');

        expect(result).toEqual([]);
    });

    test('returns base path when asset has no subdirectories', () => {
        const result = collectRequiredDirectories(['file.png'], 'data/vault');

        expect(result).toEqual(['data/vault']);
    });

    test('creates parent directories for single level path', () => {
        const result = collectRequiredDirectories(['images/pic.png'], 'data/vault');

        expect(result).toEqual([
            'data/vault',
            'data/vault/images'
        ]);
    });

    test('creates all parent directories for nested path', () => {
        const result = collectRequiredDirectories(['assets/images/subfolder/pic.png'], 'data/vault');

        expect(result).toEqual([
            'data/vault',
            'data/vault/assets',
            'data/vault/assets/images',
            'data/vault/assets/images/subfolder'
        ]);
    });

    test('sorts directories by depth', () => {
        const result = collectRequiredDirectories([
            'a/b/c/file1.png',
            'x/file2.png',
            'p/q/file3.png'
        ], 'data');

        expect(result[0]).toBe('data');
        expect(result[1]).toMatch(/^data\/(a|x|p)$/);
        expect(result.filter(d => d.split('/').length === 2).length).toBe(3);
        expect(result.filter(d => d.split('/').length === 3).length).toBe(2);
        expect(result.filter(d => d.split('/').length === 4).length).toBe(1);
    });

    test('deduplicates shared parent directories', () => {
        const result = collectRequiredDirectories([
            'images/pic1.png',
            'images/pic2.png',
            'images/subfolder/pic3.png'
        ], 'data/vault');

        expect(result).toEqual([
            'data/vault',
            'data/vault/images',
            'data/vault/images/subfolder'
        ]);
    });

    test('handles mixed depth paths correctly', () => {
        const result = collectRequiredDirectories([
            'root.png',
            'level1/file.png',
            'deep/nested/path/file.png'
        ], 'data');

        expect(result[0]).toBe('data');
        const level1Paths = result.filter(p => p.split('/').length === 2);
        expect(level1Paths).toContain('data/level1');
        expect(level1Paths).toContain('data/deep');
        expect(result).toContain('data/deep/nested');
        expect(result).toContain('data/deep/nested/path');
    });

    test('preserves directory structure for complex vault', () => {
        const result = collectRequiredDirectories([
            'Campaign/NPCs/file1.md',
            'Campaign/Locations/file2.md',
            'Rules/Homebrew/file3.md'
        ], 'worlds/my-world/obsidian');

        expect(result.length).toBe(6);
        expect(result[0]).toBe('worlds/my-world/obsidian');
        expect(result).toContain('worlds/my-world/obsidian/Campaign');
        expect(result).toContain('worlds/my-world/obsidian/Rules');
        expect(result).toContain('worlds/my-world/obsidian/Campaign/Locations');
        expect(result).toContain('worlds/my-world/obsidian/Campaign/NPCs');
        expect(result).toContain('worlds/my-world/obsidian/Rules/Homebrew');

        const depths = result.map(p => p.split('/').length);
        for (let i = 1; i < depths.length; i++) {
            expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1]);
        }
    });
});
