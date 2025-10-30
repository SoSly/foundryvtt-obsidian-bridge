import resolvePlaceholders from '../../../src/usecase/import/resolvePlaceholders.js';
import MarkdownFile from '../../../src/domain/MarkdownFile.js';
import NonMarkdownFile from '../../../src/domain/NonMarkdownFile.js';

describe('resolvePlaceholders', () => {
    describe('link resolution', () => {
        it('should resolve a basic link using basename lookup', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for details.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Target.md',
                    lookupKeys: ['Target', 'Folder/Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} for details.</p>'
            );
        });

        it('should resolve a link with display text', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for info.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: 'this page',
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target|this page]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{this page} for info.</p>'
            );
        });

        it('should resolve a link with heading and discard the heading', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>Read {{LINK:0}} section.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: 'Abilities',
                        isEmbed: false,
                        originalText: '[[Target#Abilities]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>Read @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} section.</p>'
            );
        });

        it('should resolve a link with both heading and display text', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>Check {{LINK:0}} out.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: 'abilities section',
                        heading: 'Abilities',
                        isEmbed: false,
                        originalText: '[[Target#Abilities|abilities section]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>Check @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{abilities section} out.</p>'
            );
        });

        it('should resolve an embedded note as a regular link', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>Content: {{LINK:0}}</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: true,
                        originalText: '![[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>Content: @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}</p>'
            );
        });

        it('should resolve link using longer path when basename is ambiguous', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for details.</p>',
                    links: [{
                        obsidianTarget: 'Folder/Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Folder/Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Target.md',
                    lookupKeys: ['Target', 'Folder/Target'],
                    htmlContent: '<p>Target in folder</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target at root</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.ghi789.JournalEntryPage.rst345'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Folder/Target} for details.</p>'
            );
        });

        it('should pick shortest path when multiple files have same basename', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for details.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Foo/Bar/Target.md',
                    lookupKeys: ['Target', 'Bar/Target', 'Foo/Bar/Target'],
                    htmlContent: '<p>Longer path target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                }),
                new MarkdownFile({
                    filePath: 'Baz/Target.md',
                    lookupKeys: ['Target', 'Baz/Target'],
                    htmlContent: '<p>Shorter path target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.ghi789.JournalEntryPage.rst345'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.ghi789.JournalEntryPage.rst345]{Target} for details.</p>'
            );
        });

        it('should revert to original markdown when link target not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for details.</p>',
                    links: [{
                        obsidianTarget: 'NonExistent',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[NonExistent]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe('<p>See [[NonExistent]] for details.</p>');
        });

        it('should revert to original markdown with display text when link not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for info.</p>',
                    links: [{
                        obsidianTarget: 'NonExistent',
                        displayText: 'broken link',
                        heading: null,
                        isEmbed: false,
                        originalText: '[[NonExistent|broken link]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe('<p>See [[NonExistent|broken link]] for info.</p>');
        });

        it('should resolve self-reference correctly', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>See {{LINK:0}} for more.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.abc123.JournalEntryPage.xyz789]{Target} for more.</p>'
            );
        });

        it('should resolve multiple links in same file', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} and {{LINK:1}} for details.</p>',
                    links: [
                        {
                            obsidianTarget: 'Target1',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[Target1]]',
                            placeholder: '{{LINK:0}}'
                        },
                        {
                            obsidianTarget: 'Target2',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[Target2]]',
                            placeholder: '{{LINK:1}}'
                        }
                    ],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target1.md',
                    lookupKeys: ['Target1'],
                    htmlContent: '<p>First target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                }),
                new MarkdownFile({
                    filePath: 'Target2.md',
                    lookupKeys: ['Target2'],
                    htmlContent: '<p>Second target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.ghi789.JournalEntryPage.rst345'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target1} and @UUID[JournalEntry.ghi789.JournalEntryPage.rst345]{Target2} for details.</p>'
            );
        });

        it('should resolve same link appearing multiple times', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for details. Also check {{LINK:0}} again. One more: {{LINK:0}}</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} for details. Also check @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} again. One more: @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}</p>'
            );
        });

        it('should resolve links case-insensitively', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} and {{LINK:1}} and {{LINK:2}}</p>',
                    links: [
                        {
                            obsidianTarget: 'Districts',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[Districts]]',
                            placeholder: '{{LINK:0}}'
                        },
                        {
                            obsidianTarget: 'districts',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[districts]]',
                            placeholder: '{{LINK:1}}'
                        },
                        {
                            obsidianTarget: 'DISTRICTS',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[DISTRICTS]]',
                            placeholder: '{{LINK:2}}'
                        }
                    ],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Path/To/Districts.md',
                    lookupKeys: ['Districts', 'To/Districts', 'Path/To/Districts'],
                    htmlContent: '<p>Districts content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Districts} and @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{districts} and @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{DISTRICTS}</p>'
            );
        });

        it('should skip files without foundryPageUuid when building link map', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    htmlContent: '<p>See {{LINK:0}} for details.</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: null
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe('<p>See [[Target]] for details.</p>');
        });
    });

    describe('asset resolution', () => {
        it('should resolve image asset with img tag', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>Image: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should revert to original markdown when asset not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/missing.png',
                        originalText: '![](images/missing.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe('<p>Image: ![](images/missing.png)</p>');
        });

        it('should resolve non-image asset with anchor tag', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>File: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'files/document.pdf',
                        originalText: '[Download PDF](files/document.pdf)',
                        placeholder: '{{ASSET:0}}',
                        isImage: false,
                        altText: 'Download PDF'
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'files/document.pdf',
                    foundryDataPath: 'modules/obsidian-bridge/imported/files/document.pdf'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>File: <a href="modules/obsidian-bridge/imported/files/document.pdf">Download PDF</a></p>'
            );
        });

        it('should revert to original Obsidian syntax when asset not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>File: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'files/document.pdf',
                        originalText: '![[document.pdf]]',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe('<p>File: ![[document.pdf]]</p>');
        });

        it('should resolve multiple assets in same file', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>{{ASSET:0}} and {{ASSET:1}}</p>',
                    links: [],
                    assets: [
                        {
                            obsidianPath: 'images/dragon.png',
                            originalText: '![](images/dragon.png)',
                            placeholder: '{{ASSET:0}}',
                            isImage: true,
                            altText: ''
                        },
                        {
                            obsidianPath: 'images/goblin.png',
                            originalText: '![](images/goblin.png)',
                            placeholder: '{{ASSET:1}}',
                            isImage: true,
                            altText: ''
                        }
                    ],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/dragon.png'
                }),
                new NonMarkdownFile({
                    filePath: 'images/goblin.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/goblin.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p><img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and <img src="modules/obsidian-bridge/imported/images/goblin.png" alt="" /></p>'
            );
        });

        it('should resolve same asset appearing multiple times', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>First: {{ASSET:0}} and second: {{ASSET:0}} and third: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>First: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and second: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and third: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should skip assets without foundryDataPath when building asset map', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: null
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe('<p>Image: ![](images/dragon.png)</p>');
        });

        it('should match assets by suffix when full path not provided', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'vault/assets/images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/assets/images/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>Image: <img src="modules/obsidian-bridge/imported/assets/images/dragon.png" alt="" /></p>'
            );
        });

        it('should pick shortest path when multiple assets match by suffix', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'dragon.png',
                        originalText: '![](dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'vault/assets/images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/assets/images/dragon.png'
                }),
                new NonMarkdownFile({
                    filePath: 'vault/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>Image: <img src="modules/obsidian-bridge/imported/dragon.png" alt="" /></p>'
            );
        });
    });

    describe('combined scenarios', () => {
        it('should resolve both links and assets in same file', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>See {{LINK:0}} for {{ASSET:0}}</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} for <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should handle mix of resolved and unresolved references', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>See {{LINK:0}} and {{LINK:1}} with {{ASSET:0}} and {{ASSET:1}}</p>',
                    links: [
                        {
                            obsidianTarget: 'Target',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[Target]]',
                            placeholder: '{{LINK:0}}'
                        },
                        {
                            obsidianTarget: 'Missing',
                            displayText: null,
                            heading: null,
                            isEmbed: false,
                            originalText: '[[Missing]]',
                            placeholder: '{{LINK:1}}'
                        }
                    ],
                    assets: [
                        {
                            obsidianPath: 'images/dragon.png',
                            originalText: '![](images/dragon.png)',
                            placeholder: '{{ASSET:0}}',
                            isImage: true,
                            altText: ''
                        },
                        {
                            obsidianPath: 'images/missing.png',
                            originalText: '![](images/missing.png)',
                            placeholder: '{{ASSET:1}}',
                            isImage: true,
                            altText: ''
                        }
                    ],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} and [[Missing]] with <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and ![](images/missing.png)</p>'
            );
        });

        it('should process multiple files with cross-references', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'File1.md',
                    lookupKeys: ['File1'],
                    htmlContent: '<p>See {{LINK:0}}</p>',
                    links: [{
                        obsidianTarget: 'File2',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[File2]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'File2.md',
                    lookupKeys: ['File2'],
                    htmlContent: '<p>See {{LINK:0}}</p>',
                    links: [{
                        obsidianTarget: 'File1',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[File1]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{File2}</p>'
            );
            expect(result[1].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.abc123.JournalEntryPage.xyz789]{File1}</p>'
            );
        });
    });

    describe('edge cases', () => {
        it('should return empty array for empty markdownFiles array', () => {
            const result = resolvePlaceholders([], []);
            expect(result).toEqual([]);
        });

        it('should return empty array for null markdownFiles', () => {
            const result = resolvePlaceholders(null, []);
            expect(result).toEqual([]);
        });

        it('should return empty array for undefined markdownFiles', () => {
            const result = resolvePlaceholders(undefined, []);
            expect(result).toEqual([]);
        });

        it('should handle null nonMarkdownFiles gracefully', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, null);
            expect(result[0].htmlContent).toBe('<p>Content</p>');
        });

        it('should handle undefined nonMarkdownFiles gracefully', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, undefined);
            expect(result[0].htmlContent).toBe('<p>Content</p>');
        });

        it('should handle empty nonMarkdownFiles array', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>{{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);
            expect(result[0].htmlContent).toBe('<p>![](images/dragon.png)</p>');
        });

        it('should handle file with no links or assets', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Just plain content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);
            expect(result[0].htmlContent).toBe('<p>Just plain content</p>');
        });

        it('should handle file with empty links array', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>Content with {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidianPath: 'images/dragon.png',
                        originalText: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        altText: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const nonMarkdownFiles = [
                new NonMarkdownFile({
                    filePath: 'images/dragon.png',
                    foundryDataPath: 'modules/obsidian-bridge/imported/images/dragon.png'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, nonMarkdownFiles);
            expect(result[0].htmlContent).toBe(
                '<p>Content with <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should handle file with empty assets array', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    htmlContent: '<p>See {{LINK:0}}</p>',
                    links: [{
                        obsidianTarget: 'Target',
                        displayText: null,
                        heading: null,
                        isEmbed: false,
                        originalText: '[[Target]]',
                        placeholder: '{{LINK:0}}'
                    }],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    htmlContent: '<p>Target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);
            expect(result[0].htmlContent).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}</p>'
            );
        });
    });
});
