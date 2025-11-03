import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import identifyAssets from './identify.js';
import MarkdownFile from '../domain/MarkdownFile.js';
import NonMarkdownFile from '../domain/NonMarkdownFile.js';
import Reference from '../domain/Reference.js';

global.FilePicker = {
    browse: jest.fn()
};

global.console = {
    warn: jest.fn()
};

describe('identifyAssets', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('collecting unique asset paths', () => {
        it('should collect unique asset paths from single markdown file', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/image1.png">', obsidian: '', foundry: 'assets/image1.png', type: 'asset', isImage: true }),
                        new Reference({ source: '<img src="assets/image2.png">', obsidian: '', foundry: 'assets/image2.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async (source, path) => {
                return { target: path };
            });

            const result = await identifyAssets(markdownFiles);

            expect(result.nonMarkdownFiles).toHaveLength(2);
            expect(result.nonMarkdownFiles[0]).toBeInstanceOf(NonMarkdownFile);
            expect(result.nonMarkdownFiles[0].filePath).toBe('assets/image1.png');
            expect(result.nonMarkdownFiles[0].foundryDataPath).toBe('assets/image1.png');
            expect(result.nonMarkdownFiles[1].filePath).toBe('assets/image2.png');
        });

        it('should deduplicate asset paths across multiple markdown files', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test1.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/image.png">', obsidian: '', foundry: 'assets/image.png', type: 'asset', isImage: true })
                    ]
                }),
                new MarkdownFile({
                    filePath: 'test2.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/image.png">', obsidian: '', foundry: 'assets/image.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async (source, path) => {
                return { target: path };
            });

            const result = await identifyAssets(markdownFiles);

            expect(result.nonMarkdownFiles).toHaveLength(1);
            expect(result.nonMarkdownFiles[0].filePath).toBe('assets/image.png');
        });

        it('should handle markdown files with no assets', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: []
                })
            ];

            const result = await identifyAssets(markdownFiles);

            expect(result.nonMarkdownFiles).toHaveLength(0);
        });
    });

    describe('verifying asset existence', () => {
        it('should verify asset exists using FilePicker.browse', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/image.png">', obsidian: '', foundry: 'assets/image.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async (source, path) => {
                if (path === 'assets/image.png') {
                    return { target: 'assets/image.png' };
                }
                throw new Error('File not found');
            });

            const result = await identifyAssets(markdownFiles);

            expect(global.FilePicker.browse).toHaveBeenCalledWith('data', 'assets/image.png');
            expect(result.nonMarkdownFiles).toHaveLength(1);
        });

        it('should skip assets that do not exist and log warning', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/missing.png">', obsidian: '', foundry: 'assets/missing.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async () => {
                throw new Error('File not found');
            });

            const result = await identifyAssets(markdownFiles);

            expect(global.console.warn).toHaveBeenCalledWith(
                'Asset not found in Foundry data directory: assets/missing.png'
            );
            expect(result.nonMarkdownFiles).toHaveLength(0);
        });

        it('should skip assets when FilePicker returns invalid response', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/image.png">', obsidian: '', foundry: 'assets/image.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async () => {
                return { target: null };
            });

            const result = await identifyAssets(markdownFiles);

            expect(global.console.warn).toHaveBeenCalledWith(
                'Asset not found in Foundry data directory: assets/image.png'
            );
            expect(result.nonMarkdownFiles).toHaveLength(0);
        });

        it('should handle mix of existing and missing assets', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/exists.png">', obsidian: '', foundry: 'assets/exists.png', type: 'asset', isImage: true }),
                        new Reference({ source: '<img src="assets/missing.png">', obsidian: '', foundry: 'assets/missing.png', type: 'asset', isImage: true }),
                        new Reference({ source: '<img src="assets/also-exists.png">', obsidian: '', foundry: 'assets/also-exists.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async (source, path) => {
                if (path === 'assets/exists.png' || path === 'assets/also-exists.png') {
                    return { target: path };
                }
                throw new Error('File not found');
            });

            const result = await identifyAssets(markdownFiles);

            expect(result.nonMarkdownFiles).toHaveLength(2);
            expect(result.nonMarkdownFiles[0].filePath).toBe('assets/exists.png');
            expect(result.nonMarkdownFiles[1].filePath).toBe('assets/also-exists.png');
            expect(global.console.warn).toHaveBeenCalledTimes(1);
            expect(global.console.warn).toHaveBeenCalledWith(
                'Asset not found in Foundry data directory: assets/missing.png'
            );
        });
    });

    describe('creating NonMarkdownFile objects', () => {
        it('should create NonMarkdownFile with filePath and foundryDataPath', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: [
                        new Reference({ source: '<img src="assets/images/image.png">', obsidian: '', foundry: 'assets/images/image.png', type: 'asset', isImage: true })
                    ]
                })
            ];

            global.FilePicker.browse.mockImplementation(async (source, path) => {
                return { target: `full/path/to/${path}` };
            });

            const result = await identifyAssets(markdownFiles);

            expect(result.nonMarkdownFiles[0].filePath).toBe('assets/images/image.png');
            expect(result.nonMarkdownFiles[0].foundryDataPath).toBe('full/path/to/assets/images/image.png');
        });

        it('should return result object with nonMarkdownFiles array', async () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'test.md',
                    content: 'content',
                    assets: []
                })
            ];

            const result = await identifyAssets(markdownFiles);

            expect(result).toHaveProperty('nonMarkdownFiles');
            expect(Array.isArray(result.nonMarkdownFiles)).toBe(true);
        });
    });
});
