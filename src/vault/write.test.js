import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import writeVault from './write.js';
import MarkdownFile from '../domain/MarkdownFile.js';
import NonMarkdownFile from '../domain/NonMarkdownFile.js';
import ExportOptions from '../domain/ExportOptions.js';

let mockWindow;
let mockFetch;
let mockURL;
let mockDocument;
let mockFileHandle;
let mockDirectoryHandle;
let mockWritableStream;
let mockJSZip;
let mockZipInstance;

beforeEach(() => {
    jest.clearAllMocks();

    mockWritableStream = {
        write: jest.fn(),
        close: jest.fn()
    };

    mockFileHandle = {
        createWritable: jest.fn(() => Promise.resolve(mockWritableStream))
    };

    mockDirectoryHandle = {
        getDirectoryHandle: jest.fn(function(name, options) {
            return Promise.resolve(this);
        }),
        getFileHandle: jest.fn(() => Promise.resolve(mockFileHandle)),
        requestPermission: jest.fn(() => Promise.resolve('granted'))
    };

    mockWindow = {
        showDirectoryPicker: jest.fn(() => Promise.resolve(mockDirectoryHandle))
    };

    mockFetch = jest.fn(path => {
        return Promise.resolve({
            ok: true,
            status: 200,
            blob: () => Promise.resolve(new Blob([`content of ${path}`]))
        });
    });

    mockURL = {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
        revokeObjectURL: jest.fn()
    };

    mockDocument = {
        body: {
            appendChild: jest.fn(),
            removeChild: jest.fn()
        },
        createElement: jest.fn(tag => {
            if (tag === 'a') {
                return {
                    click: jest.fn(),
                    href: '',
                    download: ''
                };
            }
        })
    };

    mockZipInstance = {
        file: jest.fn().mockReturnThis(),
        generateAsync: jest.fn(() => Promise.resolve({ type: 'blob', data: 'zip content' }))
    };

    mockJSZip = jest.fn(() => mockZipInstance);

    global.window = mockWindow;
    global.fetch = mockFetch;
    global.URL = mockURL;
    global.document = mockDocument;
    global.Blob = class Blob {
        constructor(content) {
            this.content = content;
            this.type = 'application/octet-stream';
        }
    };
    global.JSZip = mockJSZip;
});

describe('writeVault', () => {
    describe('detection and routing', () => {
        it('should use filesystem API when directoryHandle is provided', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            await writeVault(markdownFiles, [], exportOptions);

            expect(mockDirectoryHandle.requestPermission).toHaveBeenCalled();
        });

        it('should use ZIP fallback when directoryHandle is not provided', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(1);
            expect(mockJSZip).toHaveBeenCalled();
        });
    });

    describe('writeToZip', () => {
        beforeEach(() => {
            delete global.window.showDirectoryPicker;
        });

        it('should add markdown files to ZIP', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test1.md', content: 'content 1' }),
                new MarkdownFile({ filePath: 'folder/test2.md', content: 'content 2' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(2);
            expect(result.assetsWritten).toBe(0);
            expect(result.errors).toHaveLength(0);
        });

        it('should fetch and add asset files to ZIP', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];
            const nonMarkdownFiles = [
                new NonMarkdownFile({ filePath: 'assets/image.png', foundryDataPath: '/data/image.png' })
            ];

            const result = await writeVault(markdownFiles, nonMarkdownFiles, exportOptions);

            expect(mockFetch).toHaveBeenCalledWith('/data/image.png');
            expect(result.filesWritten).toBe(1);
            expect(result.assetsWritten).toBe(1);
            expect(result.errors).toHaveLength(0);
        });

        it('should trigger download with correct filename', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            await writeVault(markdownFiles, [], exportOptions);

            expect(mockURL.createObjectURL).toHaveBeenCalled();
            expect(mockDocument.createElement).toHaveBeenCalledWith('a');
            expect(mockDocument.body.appendChild).toHaveBeenCalled();
        });

        it('should handle failed asset fetch gracefully', async () => {
            mockFetch.mockImplementation(path => {
                if (path.includes('missing')) {
                    return Promise.resolve({ ok: false, status: 404 });
                }
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(new Blob(['content']))
                });
            });

            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];
            const nonMarkdownFiles = [
                new NonMarkdownFile({ filePath: 'assets/exists.png', foundryDataPath: '/data/exists.png' }),
                new NonMarkdownFile({ filePath: 'assets/missing.png', foundryDataPath: '/data/missing.png' })
            ];

            const result = await writeVault(markdownFiles, nonMarkdownFiles, exportOptions);

            expect(result.filesWritten).toBe(1);
            expect(result.assetsWritten).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('assets/missing.png');
        });

        it('should handle markdown file addition errors', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            mockZipInstance.file.mockImplementationOnce(() => {
                throw new Error('ZIP error');
            });

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('ZIP error'))).toBe(true);
        });
    });

    describe('writeToFilesystem', () => {
        it('should request write permission for directory', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            await writeVault(markdownFiles, [], exportOptions);

            expect(mockDirectoryHandle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
        });

        it('should write markdown file to filesystem', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'test content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith('test.md', { create: true });
            expect(mockWritableStream.write).toHaveBeenCalledWith('test content');
            expect(mockWritableStream.close).toHaveBeenCalled();
            expect(result.filesWritten).toBe(1);
        });

        it('should create nested directories for markdown files', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'folder/subfolder/test.md', content: 'content' })
            ];

            await writeVault(markdownFiles, [], exportOptions);

            expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('folder', { create: true });
            expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('subfolder', { create: true });
            expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith('test.md', { create: true });
        });

        it('should write asset files by fetching and streaming', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];
            const nonMarkdownFiles = [
                new NonMarkdownFile({ filePath: 'assets/image.png', foundryDataPath: '/data/worlds/myworld/image.png' })
            ];

            const result = await writeVault(markdownFiles, nonMarkdownFiles, exportOptions);

            expect(mockFetch).toHaveBeenCalledWith('/data/worlds/myworld/image.png');
            expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('assets', { create: true });
            expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith('image.png', { create: true });
            expect(result.assetsWritten).toBe(1);
        });

        it('should handle permission denial', async () => {
            mockDirectoryHandle.requestPermission.mockResolvedValue('denied');

            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Write permission not granted');
        });

        it('should handle file write errors and continue', async () => {
            mockWritableStream.write.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test1.md', content: 'content 1' }),
                new MarkdownFile({ filePath: 'test2.md', content: 'content 2' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(0);
            expect(result.errors).toHaveLength(2);
        });

        it('should handle empty path parts gracefully', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: '/test.md', content: 'content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(1);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle empty string content', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: '' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(1);
            expect(mockWritableStream.write).toHaveBeenCalledWith('');
        });

        it('should handle failed asset HTTP responses', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];
            const nonMarkdownFiles = [
                new NonMarkdownFile({ filePath: 'assets/broken.png', foundryDataPath: '/data/broken.png' })
            ];

            const result = await writeVault(markdownFiles, nonMarkdownFiles, exportOptions);

            expect(result.assetsWritten).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('HTTP 500');
        });
    });

    describe('error tracking', () => {
        it('should track partial success with mixed results', async () => {
            mockWritableStream.write.mockImplementation(content => {
                if (content.includes('fail')) {
                    throw new Error('Write failed');
                }
            });

            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({
                journals: [mockJournalEntry],
                directoryHandle: mockDirectoryHandle
            });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'success.md', content: 'success content' }),
                new MarkdownFile({ filePath: 'fail.md', content: 'fail content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(1);
            expect(result.errors).toHaveLength(1);
        });

        it('should return empty errors array on complete success', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.errors).toHaveLength(0);
            expect(result.filesWritten).toBe(1);
        });
    });

    describe('edge cases', () => {
        it('should handle empty markdown files array', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });

            const result = await writeVault([], [], exportOptions);

            expect(result.filesWritten).toBe(0);
            expect(result.assetsWritten).toBe(0);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle empty nonMarkdownFiles array', async () => {
            const mockJournalEntry = { name: 'Test', pages: [] };
            const exportOptions = new ExportOptions({ journals: [mockJournalEntry] });
            const markdownFiles = [
                new MarkdownFile({ filePath: 'test.md', content: 'content' })
            ];

            const result = await writeVault(markdownFiles, [], exportOptions);

            expect(result.filesWritten).toBe(1);
            expect(result.assetsWritten).toBe(0);
        });
    });
});
