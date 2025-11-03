import { jest } from '@jest/globals';
import { resolveAssetFile } from './find';

describe('resolveAssetFile', () => {
    let consoleWarnSpy;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    function createMockFile(webkitRelativePath) {
        return {
            webkitRelativePath,
            name: webkitRelativePath.split('/').pop()
        };
    }

    function createMockFileList(paths) {
        const files = paths.map(path => createMockFile(path));
        files.item = index => files[index];
        return files;
    }

    describe('exact path match', () => {
        it('should find file with exact path match', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/dragon.png',
                'MyVault/Notes/test.md'
            ]);

            const result = resolveAssetFile('Images/dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/dragon.png');
        });

        it('should strip vault root from path', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Assets/image.jpg'
            ]);

            const result = resolveAssetFile('Assets/image.jpg', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Assets/image.jpg');
        });
    });

    describe('filename only match', () => {
        it('should find file when given only filename', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/Monsters/dragon.png',
                'MyVault/Notes/test.md'
            ]);

            const result = resolveAssetFile('dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/Monsters/dragon.png');
        });

        it('should find file with partial path', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/Monsters/dragon.png'
            ]);

            const result = resolveAssetFile('Monsters/dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/Monsters/dragon.png');
        });
    });

    describe('ambiguous matches', () => {
        it('should return first match when multiple files have same name', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/dragon.png',
                'MyVault/Assets/dragon.png'
            ]);

            const result = resolveAssetFile('dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/dragon.png');
        });
    });

    describe('no match', () => {
        it('should return null when file not found', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/dragon.png'
            ]);

            const result = resolveAssetFile('missing.png', vaultFiles);

            expect(result).toBeNull();
        });

        it('should return null for empty file list', () => {
            const vaultFiles = createMockFileList([]);

            const result = resolveAssetFile('dragon.png', vaultFiles);

            expect(result).toBeNull();
        });
    });

    describe('path normalization', () => {
        it('should handle backslashes in asset path', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/dragon.png'
            ]);

            const result = resolveAssetFile('Images\\dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/dragon.png');
        });
    });

    describe('edge cases', () => {
        it('should skip files without webkitRelativePath', () => {
            const vaultFiles = [
                { name: 'test.png' },
                createMockFile('MyVault/Images/dragon.png')
            ];
            vaultFiles.length = 2;
            vaultFiles.item = index => vaultFiles[index];

            const result = resolveAssetFile('dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/dragon.png');
        });

        it('should handle files with spaces in names', () => {
            const vaultFiles = createMockFileList([
                'MyVault/Images/Ancient Red Dragon.png'
            ]);

            const result = resolveAssetFile('Ancient Red Dragon.png', vaultFiles);

            expect(result).not.toBeNull();
            expect(result.webkitRelativePath).toBe('MyVault/Images/Ancient Red Dragon.png');
        });
    });
});
