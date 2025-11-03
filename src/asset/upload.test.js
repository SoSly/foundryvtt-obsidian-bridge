import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { uploadAssets, rollbackUploads } from './upload.js';
import MarkdownFile from '../domain/MarkdownFile.js';
import Reference from '../domain/Reference.js';
import ImportOptions from '../domain/ImportOptions.js';

let mockFilePicker;
let mockConsole;

beforeEach(() => {
    jest.clearAllMocks();

    mockFilePicker = {
        upload: jest.fn(),
        delete: jest.fn(),
        browse: jest.fn(),
        createDirectory: jest.fn()
    };

    mockConsole = {
        warn: jest.fn(),
        error: jest.fn()
    };

    global.FilePicker = mockFilePicker;
    global.console = mockConsole;
});

describe('uploadAssets', () => {
    describe('filtering imported files', () => {
        it('should only process markdown files with foundryPageUuid', async () => {
            const importedFile = new MarkdownFile({
                filePath: 'imported.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset1.png)', obsidian: 'asset1.png', foundry: 'asset1.png', type: 'asset', isImage: true })
                ]
            });
            importedFile.foundryPageUuid = 'JournalEntryPage.abc123';

            const notImportedFile = new MarkdownFile({
                filePath: 'not-imported.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset2.png)', obsidian: 'asset2.png', foundry: 'asset2.png', type: 'asset', isImage: true })
                ]
            });

            const vaultFiles = createMockFileList([
                { name: 'asset1.png', path: 'vault/asset1.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/asset1.png' });

            const result = await uploadAssets([importedFile, notImportedFile], vaultFiles, importOptions);

            expect(mockFilePicker.upload).toHaveBeenCalledTimes(1);
            expect(result.nonMarkdownFiles).toHaveLength(1);
            expect(result.uploadedPaths).toEqual(['worlds/test/vault/asset1.png']);
        });

        it('should return empty results when no files have foundryPageUuid', async () => {
            const notImportedFile = new MarkdownFile({
                filePath: 'not-imported.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset.png)', obsidian: 'asset.png', foundry: 'asset.png', type: 'asset', isImage: true })
                ]
            });

            const vaultFiles = createMockFileList([]);
            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            const result = await uploadAssets([notImportedFile], vaultFiles, importOptions);

            expect(result.nonMarkdownFiles).toHaveLength(0);
            expect(result.uploadedPaths).toHaveLength(0);
            expect(mockFilePicker.upload).not.toHaveBeenCalled();
        });
    });

    describe('collecting unique asset paths', () => {
        it('should deduplicate asset paths across multiple files', async () => {
            const file1 = new MarkdownFile({
                filePath: 'file1.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](shared.png)', obsidian: 'shared.png', foundry: 'shared.png', type: 'asset', isImage: true })
                ]
            });
            file1.foundryPageUuid = 'JournalEntryPage.abc123';

            const file2 = new MarkdownFile({
                filePath: 'file2.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](shared.png)', obsidian: 'shared.png', foundry: 'shared.png', type: 'asset', isImage: true })
                ]
            });
            file2.foundryPageUuid = 'JournalEntryPage.def456';

            const vaultFiles = createMockFileList([
                { name: 'shared.png', path: 'vault/shared.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/shared.png' });

            const result = await uploadAssets([file1, file2], vaultFiles, importOptions);

            expect(mockFilePicker.upload).toHaveBeenCalledTimes(1);
            expect(result.nonMarkdownFiles).toHaveLength(1);
        });

        it('should return empty results when no assets exist', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: []
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([]);
            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            const result = await uploadAssets([file], vaultFiles, importOptions);

            expect(result.nonMarkdownFiles).toHaveLength(0);
            expect(result.uploadedPaths).toHaveLength(0);
        });
    });

    describe('resolving vault files', () => {
        it('should skip assets not found in vault FileList', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](missing.png)', obsidian: 'missing.png', foundry: 'missing.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'other.png', path: 'vault/other.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            const result = await uploadAssets([file], vaultFiles, importOptions);

            expect(mockConsole.warn).toHaveBeenCalledWith('Asset referenced but not found in vault: missing.png');
            expect(mockFilePicker.upload).not.toHaveBeenCalled();
            expect(result.nonMarkdownFiles).toHaveLength(0);
        });

        it('should resolve assets with nested paths', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](images/deep/nested.png)', obsidian: 'images/deep/nested.png', foundry: 'images/deep/nested.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'nested.png', path: 'vault/images/deep/nested.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/images/deep/nested.png' });

            const result = await uploadAssets([file], vaultFiles, importOptions);

            expect(mockFilePicker.upload).toHaveBeenCalledWith(
                'data',
                'worlds/test/vault/images/deep',
                expect.any(Object),
                {},
                { notify: false }
            );
            expect(result.nonMarkdownFiles).toHaveLength(1);
        });
    });

    describe('directory creation', () => {
        it('should create directories that do not exist', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](images/asset.png)', obsidian: 'images/asset.png', foundry: 'images/asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/images/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.browse.mockRejectedValue(new Error('Directory not found'));
            mockFilePicker.createDirectory.mockResolvedValue({});
            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/images/asset.png' });

            await uploadAssets([file], vaultFiles, importOptions);

            expect(mockFilePicker.browse).toHaveBeenCalledWith('data', 'worlds/test/vault/images');
            expect(mockFilePicker.createDirectory).toHaveBeenCalledWith('data', 'worlds/test/vault/images');
        });

        it('should not create directories that already exist', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](images/asset.png)', obsidian: 'images/asset.png', foundry: 'images/asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/images/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.browse.mockResolvedValue({ target: 'worlds/test/vault/images' });
            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/images/asset.png' });

            await uploadAssets([file], vaultFiles, importOptions);

            expect(mockFilePicker.createDirectory).not.toHaveBeenCalled();
        });

        it('should handle directory creation failures gracefully', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](images/asset.png)', obsidian: 'images/asset.png', foundry: 'images/asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/images/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.browse.mockRejectedValue(new Error('Directory not found'));
            mockFilePicker.createDirectory.mockRejectedValue(new Error('Permission denied'));
            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/images/asset.png' });

            await uploadAssets([file], vaultFiles, importOptions);

            expect(mockConsole.warn).toHaveBeenCalledWith(
                'Failed to create directory worlds/test/vault/images:',
                expect.any(Error)
            );
        });
    });

    describe('uploading files', () => {
        it('should upload asset to correct directory', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset.png)', obsidian: 'asset.png', foundry: 'asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/asset.png' });

            const result = await uploadAssets([file], vaultFiles, importOptions);

            expect(mockFilePicker.upload).toHaveBeenCalledWith(
                'data',
                'worlds/test/vault',
                expect.objectContaining({ name: 'asset.png' }),
                {},
                { notify: false }
            );
            expect(result.nonMarkdownFiles[0].filePath).toBe('asset.png');
            expect(result.nonMarkdownFiles[0].foundryDataPath).toBe('worlds/test/vault/asset.png');
        });

        it('should create NonMarkdownFile with correct paths', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](images/asset.png)', obsidian: 'images/asset.png', foundry: 'images/asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/images/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue({ path: 'worlds/test/vault/images/asset.png' });

            const result = await uploadAssets([file], vaultFiles, importOptions);

            expect(result.nonMarkdownFiles).toHaveLength(1);
            expect(result.nonMarkdownFiles[0].filePath).toBe('images/asset.png');
            expect(result.nonMarkdownFiles[0].foundryDataPath).toBe('worlds/test/vault/images/asset.png');
        });

        it('should throw error when upload fails', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset.png)', obsidian: 'asset.png', foundry: 'asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue(null);

            await expect(uploadAssets([file], vaultFiles, importOptions)).rejects.toThrow('Failed to upload asset: asset.png');
        });

        it('should throw error when upload response missing path', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset.png)', obsidian: 'asset.png', foundry: 'asset.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset.png', path: 'vault/asset.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload.mockResolvedValue({ path: null });

            await expect(uploadAssets([file], vaultFiles, importOptions)).rejects.toThrow('Failed to upload asset: asset.png');
        });

        it('should upload multiple assets in parallel', async () => {
            const file = new MarkdownFile({
                filePath: 'file.md',
                content: 'content',
                assets: [
                    new Reference({ source: '![img](asset1.png)', obsidian: 'asset1.png', foundry: 'asset1.png', type: 'asset', isImage: true }),
                    new Reference({ source: '![img](asset2.png)', obsidian: 'asset2.png', foundry: 'asset2.png', type: 'asset', isImage: true })
                ]
            });
            file.foundryPageUuid = 'JournalEntryPage.abc123';

            const vaultFiles = createMockFileList([
                { name: 'asset1.png', path: 'vault/asset1.png' },
                { name: 'asset2.png', path: 'vault/asset2.png' }
            ]);

            const importOptions = new ImportOptions({ dataPath: 'worlds/test/vault' });

            mockFilePicker.upload
                .mockResolvedValueOnce({ path: 'worlds/test/vault/asset1.png' })
                .mockResolvedValueOnce({ path: 'worlds/test/vault/asset2.png' });

            const result = await uploadAssets([file], vaultFiles, importOptions);

            expect(mockFilePicker.upload).toHaveBeenCalledTimes(2);
            expect(result.nonMarkdownFiles).toHaveLength(2);
            expect(result.uploadedPaths).toEqual([
                'worlds/test/vault/asset1.png',
                'worlds/test/vault/asset2.png'
            ]);
        });
    });
});

describe('rollbackUploads', () => {
    it('should delete all uploaded files in reverse order', async () => {
        const uploadedPaths = [
            'worlds/test/vault/asset1.png',
            'worlds/test/vault/asset2.png',
            'worlds/test/vault/asset3.png'
        ];

        mockFilePicker.delete.mockResolvedValue({});

        await rollbackUploads(uploadedPaths);

        expect(mockFilePicker.delete).toHaveBeenCalledTimes(3);
        expect(mockFilePicker.delete).toHaveBeenNthCalledWith(1, 'data', 'worlds/test/vault/asset3.png', { notify: false });
        expect(mockFilePicker.delete).toHaveBeenNthCalledWith(2, 'data', 'worlds/test/vault/asset2.png', { notify: false });
        expect(mockFilePicker.delete).toHaveBeenNthCalledWith(3, 'data', 'worlds/test/vault/asset1.png', { notify: false });
    });

    it('should handle empty array', async () => {
        await rollbackUploads([]);

        expect(mockFilePicker.delete).not.toHaveBeenCalled();
    });

    it('should continue deleting even if one fails', async () => {
        const uploadedPaths = [
            'worlds/test/vault/asset1.png',
            'worlds/test/vault/asset2.png',
            'worlds/test/vault/asset3.png'
        ];

        mockFilePicker.delete
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('Delete failed'))
            .mockResolvedValueOnce({});

        await rollbackUploads(uploadedPaths);

        expect(mockFilePicker.delete).toHaveBeenCalledTimes(3);
        expect(mockConsole.error).toHaveBeenCalledWith(
            'Failed to rollback asset worlds/test/vault/asset2.png:',
            expect.any(Error)
        );
    });

    it('should not throw error on deletion failures', async () => {
        const uploadedPaths = ['worlds/test/vault/asset.png'];

        mockFilePicker.delete.mockRejectedValue(new Error('Delete failed'));

        await expect(rollbackUploads(uploadedPaths)).resolves.not.toThrow();
    });
});

function createMockFileList(files) {
    return files.map(f => ({
        name: f.name,
        webkitRelativePath: f.path
    }));
}
