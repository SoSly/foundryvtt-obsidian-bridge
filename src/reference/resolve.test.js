import { jest } from '@jest/globals';
import resolvePlaceholders, { resolveForExport } from './resolve.js';
import MarkdownFile from '../domain/MarkdownFile.js';
import NonMarkdownFile from '../domain/NonMarkdownFile.js';
import Reference from '../domain/Reference.js';

describe('resolvePlaceholders', () => {
    let consoleWarnSpy;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });
    describe('link resolution', () => {
        it('should resolve a basic link using basename lookup', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for details.</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Target.md',
                    lookupKeys: ['Target', 'Folder/Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} for details.</p>'
            );
        });

        it('should resolve a link with display text', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for info.</p>',
                    links: [new Reference({ source: '[[Target|this page]]', obsidian: 'Target', label: 'this page', type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{this page} for info.</p>'
            );
        });

        it('should resolve a link with heading and discard the heading', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>Read {{LINK:0}} section.</p>',
                    links: [new Reference({ source: '[[Target#Abilities]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: 'Abilities', isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Read @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} section.</p>'
            );
        });

        it('should resolve a link with both heading and display text', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>Check {{LINK:0}} out.</p>',
                    links: [new Reference({ source: '[[Target#Abilities|abilities section]]', obsidian: 'Target', label: 'abilities section', type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: 'Abilities', isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Check @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{abilities section} out.</p>'
            );
        });

        it('should resolve an embedded note as a regular link', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>Content: {{LINK:0}}</p>',
                    links: [new Reference({ source: '![[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: true } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Content: @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}</p>'
            );
        });

        it('should resolve link using longer path when basename is ambiguous', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for details.</p>',
                    links: [new Reference({ source: '[[Folder/Target]]', obsidian: 'Folder/Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Target.md',
                    lookupKeys: ['Target', 'Folder/Target'],
                    content: '<p>Target in folder</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target at root</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.ghi789.JournalEntryPage.rst345'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Folder/Target} for details.</p>'
            );
        });

        it('should pick shortest path when multiple files have same basename (fallback)', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for details.</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Foo/Bar/Target.md',
                    lookupKeys: ['Target', 'Bar/Target', 'Foo/Bar/Target'],
                    content: '<p>Longer path target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                }),
                new MarkdownFile({
                    filePath: 'Baz/Target.md',
                    lookupKeys: ['Target', 'Baz/Target'],
                    content: '<p>Shorter path target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.ghi789.JournalEntryPage.rst345'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.ghi789.JournalEntryPage.rst345]{Target} for details.</p>'
            );
        });

        it('should revert to original markdown when link target not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for details.</p>',
                    links: [new Reference({ source: '[[NonExistent]]', obsidian: 'NonExistent', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe('<p>See [[NonExistent]] for details.</p>');
        });

        it('should revert to original markdown with display text when link not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for info.</p>',
                    links: [new Reference({ source: '[[NonExistent|broken link]]', obsidian: 'NonExistent', label: 'broken link', type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe('<p>See [[NonExistent|broken link]] for info.</p>');
        });

        it('should resolve self-reference correctly', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>See {{LINK:0}} for more.</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.abc123.JournalEntryPage.xyz789]{Target} for more.</p>'
            );
        });

        it('should resolve multiple links in same file', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} and {{LINK:1}} for details.</p>',
                    links: [
                        new Reference({ source: '[[Target1]]', obsidian: 'Target1', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } }),
                        new Reference({ source: '[[Target2]]', obsidian: 'Target2', label: null, type: 'document', isImage: false, placeholder: '{{LINK:1}}', metadata: { heading: null, isEmbed: false } })
                    ],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target1.md',
                    lookupKeys: ['Target1'],
                    content: '<p>First target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                }),
                new MarkdownFile({
                    filePath: 'Target2.md',
                    lookupKeys: ['Target2'],
                    content: '<p>Second target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.ghi789.JournalEntryPage.rst345'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target1} and @UUID[JournalEntry.ghi789.JournalEntryPage.rst345]{Target2} for details.</p>'
            );
        });

        it('should resolve same link appearing multiple times', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for details. Also check {{LINK:0}} again. One more: {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} for details. Also check @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} again. One more: @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}</p>'
            );
        });

        it('should resolve links case-insensitively', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} and {{LINK:1}} and {{LINK:2}}</p>',
                    links: [
                        new Reference({ source: '[[Districts]]', obsidian: 'Districts', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } }),
                        new Reference({ source: '[[districts]]', obsidian: 'districts', label: null, type: 'document', isImage: false, placeholder: '{{LINK:1}}', metadata: { heading: null, isEmbed: false } }),
                        new Reference({ source: '[[DISTRICTS]]', obsidian: 'DISTRICTS', label: null, type: 'document', isImage: false, placeholder: '{{LINK:2}}', metadata: { heading: null, isEmbed: false } })
                    ],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Path/To/Districts.md',
                    lookupKeys: ['Districts', 'To/Districts', 'Path/To/Districts'],
                    content: '<p>Districts content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Districts} and @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{districts} and @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{DISTRICTS}</p>'
            );
        });

        it('should skip files without foundryPageUuid when building link map', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: '<p>See {{LINK:0}} for details.</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: null
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe('<p>See [[Target]] for details.</p>');
        });
    });

    describe('context-aware link resolution', () => {
        it('should prioritize files in same folder over files elsewhere', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Villain.md',
                    lookupKeys: ['Villain', 'NPCs/Villain', 'Campaign/NPCs/Villain'],
                    content: '<p>Check out {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Waterdeep]]', obsidian: 'Waterdeep', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.villain'
                }),
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'NPCs/Waterdeep', 'Campaign/NPCs/Waterdeep'],
                    content: '<p>NPC named Waterdeep</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.npc-waterdeep'
                }),
                new MarkdownFile({
                    filePath: 'Campaign/Locations/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'Locations/Waterdeep', 'Campaign/Locations/Waterdeep'],
                    content: '<p>City of Waterdeep</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.location-waterdeep'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Check out @UUID[JournalEntry.xxx.JournalEntryPage.npc-waterdeep]{Waterdeep}</p>'
            );
        });

        it('should prioritize files in parent folder when no same-folder match exists', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Villains/BigBad.md',
                    lookupKeys: ['BigBad', 'Villains/BigBad', 'NPCs/Villains/BigBad', 'Campaign/NPCs/Villains/BigBad'],
                    content: '<p>Lives in {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Waterdeep]]', obsidian: 'Waterdeep', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.bigbad'
                }),
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'NPCs/Waterdeep', 'Campaign/NPCs/Waterdeep'],
                    content: '<p>NPC named Waterdeep</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.npc-waterdeep'
                }),
                new MarkdownFile({
                    filePath: 'Other/Locations/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'Locations/Waterdeep', 'Other/Locations/Waterdeep'],
                    content: '<p>City of Waterdeep</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.location-waterdeep'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Lives in @UUID[JournalEntry.xxx.JournalEntryPage.npc-waterdeep]{Waterdeep}</p>'
            );
        });

        it('should walk up parent folders from most specific to root', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Villains/MiniBoss/Details.md',
                    lookupKeys: ['Details', 'MiniBoss/Details', 'Villains/MiniBoss/Details', 'NPCs/Villains/MiniBoss/Details', 'Campaign/NPCs/Villains/MiniBoss/Details'],
                    content: '<p>Check {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Waterdeep]]', obsidian: 'Waterdeep', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.details'
                }),
                new MarkdownFile({
                    filePath: 'Campaign/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'Campaign/Waterdeep'],
                    content: '<p>Campaign-level Waterdeep</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.campaign-waterdeep'
                }),
                new MarkdownFile({
                    filePath: 'Other/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'Other/Waterdeep'],
                    content: '<p>Other Waterdeep</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.other-waterdeep'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Check @UUID[JournalEntry.xxx.JournalEntryPage.campaign-waterdeep]{Waterdeep}</p>'
            );
        });

        it('should fall back to shortest path when no contextual match exists', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Villain.md',
                    lookupKeys: ['Villain', 'NPCs/Villain', 'Campaign/NPCs/Villain'],
                    content: '<p>Check out {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Waterdeep]]', obsidian: 'Waterdeep', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.villain'
                }),
                new MarkdownFile({
                    filePath: 'Other/Locations/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'Locations/Waterdeep', 'Other/Locations/Waterdeep'],
                    content: '<p>Long path</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.long-waterdeep'
                }),
                new MarkdownFile({
                    filePath: 'Places/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'Places/Waterdeep'],
                    content: '<p>Short path</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.short-waterdeep'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Check out @UUID[JournalEntry.xxx.JournalEntryPage.short-waterdeep]{Waterdeep}</p>'
            );
        });

        it('should handle files in root folder correctly', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Root.md',
                    lookupKeys: ['Root'],
                    content: '<p>Check {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Other]]', obsidian: 'Other', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.root'
                }),
                new MarkdownFile({
                    filePath: 'Other.md',
                    lookupKeys: ['Other'],
                    content: '<p>Also in root</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.other-root'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Other.md',
                    lookupKeys: ['Other', 'Folder/Other'],
                    content: '<p>In folder</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.other-folder'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Check @UUID[JournalEntry.xxx.JournalEntryPage.other-root]{Other}</p>'
            );
        });

        it('should use shortest path as tiebreaker within same priority level', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Villain.md',
                    lookupKeys: ['Villain', 'NPCs/Villain', 'Campaign/NPCs/Villain'],
                    content: '<p>Check {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Waterdeep]]', obsidian: 'Waterdeep', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.villain'
                }),
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/Waterdeep.md',
                    lookupKeys: ['Waterdeep', 'NPCs/Waterdeep', 'Campaign/NPCs/Waterdeep'],
                    content: '<p>Short name</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.short'
                }),
                new MarkdownFile({
                    filePath: 'Campaign/NPCs/WaterdeepLongName.md',
                    lookupKeys: ['Waterdeep', 'NPCs/Waterdeep', 'Campaign/NPCs/Waterdeep'],
                    content: '<p>Long name</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.long'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>Check @UUID[JournalEntry.xxx.JournalEntryPage.short]{Waterdeep}</p>'
            );
        });

        it('should work correctly when source file is in root', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Notes.md',
                    lookupKeys: ['Notes'],
                    content: '<p>See {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.notes'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target in root</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.target-root'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Target.md',
                    lookupKeys: ['Target', 'Folder/Target'],
                    content: '<p>Target in folder</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.xxx.JournalEntryPage.target-folder'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.xxx.JournalEntryPage.target-root]{Target}</p>'
            );
        });
    });

    describe('asset resolution', () => {
        it('should resolve image asset with img tag', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
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

            expect(result[0].content).toBe(
                '<p>Image: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should revert to original markdown when asset not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/missing.png',
                        source: '![](images/missing.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe('<p>Image: ![](images/missing.png)</p>');
        });

        it('should resolve non-image asset with anchor tag', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>File: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'files/document.pdf',
                        source: '[Download PDF](files/document.pdf)',
                        placeholder: '{{ASSET:0}}',
                        isImage: false,
                        label: 'Download PDF'
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

            expect(result[0].content).toBe(
                '<p>File: <a href="modules/obsidian-bridge/imported/files/document.pdf">Download PDF</a></p>'
            );
        });

        it('should revert to original Obsidian syntax when asset not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>File: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'files/document.pdf',
                        source: '![[document.pdf]]',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe('<p>File: ![[document.pdf]]</p>');
        });

        it('should resolve multiple assets in same file', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>{{ASSET:0}} and {{ASSET:1}}</p>',
                    links: [],
                    assets: [
                        {
                            obsidian: 'images/dragon.png',
                            source: '![](images/dragon.png)',
                            placeholder: '{{ASSET:0}}',
                            isImage: true,
                            label: ''
                        },
                        {
                            obsidian: 'images/goblin.png',
                            source: '![](images/goblin.png)',
                            placeholder: '{{ASSET:1}}',
                            isImage: true,
                            label: ''
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

            expect(result[0].content).toBe(
                '<p><img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and <img src="modules/obsidian-bridge/imported/images/goblin.png" alt="" /></p>'
            );
        });

        it('should resolve same asset appearing multiple times', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>First: {{ASSET:0}} and second: {{ASSET:0}} and third: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
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

            expect(result[0].content).toBe(
                '<p>First: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and second: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and third: <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should skip assets without foundryDataPath when building asset map', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
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

            expect(result[0].content).toBe('<p>Image: ![](images/dragon.png)</p>');
        });

        it('should match assets by suffix when full path not provided', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
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

            expect(result[0].content).toBe(
                '<p>Image: <img src="modules/obsidian-bridge/imported/assets/images/dragon.png" alt="" /></p>'
            );
        });

        it('should pick shortest path when multiple assets match by suffix', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Image: {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'dragon.png',
                        source: '![](dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
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

            expect(result[0].content).toBe(
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
                    content: '<p>See {{LINK:0}} for {{ASSET:0}}</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
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

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} for <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should handle mix of resolved and unresolved references', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>See {{LINK:0}} and {{LINK:1}} with {{ASSET:0}} and {{ASSET:1}}</p>',
                    links: [
                        new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } }),
                        new Reference({ source: '[[Missing]]', obsidian: 'Missing', label: null, type: 'document', isImage: false, placeholder: '{{LINK:1}}', metadata: { heading: null, isEmbed: false } })
                    ],
                    assets: [
                        {
                            obsidian: 'images/dragon.png',
                            source: '![](images/dragon.png)',
                            placeholder: '{{ASSET:0}}',
                            isImage: true,
                            label: ''
                        },
                        {
                            obsidian: 'images/missing.png',
                            source: '![](images/missing.png)',
                            placeholder: '{{ASSET:1}}',
                            isImage: true,
                            label: ''
                        }
                    ],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target content</p>',
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

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target} and [[Missing]] with <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /> and ![](images/missing.png)</p>'
            );
        });

        it('should process multiple files with cross-references', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'File1.md',
                    lookupKeys: ['File1'],
                    content: '<p>See {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[File2]]', obsidian: 'File2', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'File2.md',
                    lookupKeys: ['File2'],
                    content: '<p>See {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[File1]]', obsidian: 'File1', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);

            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{File2}</p>'
            );
            expect(result[1].content).toBe(
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
                    content: '<p>Content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, null);
            expect(result[0].content).toBe('<p>Content</p>');
        });

        it('should handle undefined nonMarkdownFiles gracefully', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, undefined);
            expect(result[0].content).toBe('<p>Content</p>');
        });

        it('should handle empty nonMarkdownFiles array', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>{{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
                    }],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);
            expect(result[0].content).toBe('<p>![](images/dragon.png)</p>');
        });

        it('should handle file with no links or assets', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Just plain content</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);
            expect(result[0].content).toBe('<p>Just plain content</p>');
        });

        it('should handle file with empty links array', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>Content with {{ASSET:0}}</p>',
                    links: [],
                    assets: [{
                        obsidian: 'images/dragon.png',
                        source: '![](images/dragon.png)',
                        placeholder: '{{ASSET:0}}',
                        isImage: true,
                        label: ''
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
            expect(result[0].content).toBe(
                '<p>Content with <img src="modules/obsidian-bridge/imported/images/dragon.png" alt="" /></p>'
            );
        });

        it('should handle file with empty assets array', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: '<p>See {{LINK:0}}</p>',
                    links: [new Reference({ source: '[[Target]]', obsidian: 'Target', label: null, type: 'document', isImage: false, placeholder: '{{LINK:0}}', metadata: { heading: null, isEmbed: false } })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: '<p>Target</p>',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolvePlaceholders(markdownFiles, []);
            expect(result[0].content).toBe(
                '<p>See @UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}</p>'
            );
        });
    });
});

describe('resolveForExport', () => {
    let consoleWarnSpy;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    describe('journal link resolution', () => {
        it('should resolve journal reference to Obsidian link in same folder', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: 'See {{LINK:0}} for details.',
                    links: [new Reference({
                        source: '@UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}',
                        foundry: 'JournalEntry.def456.JournalEntryPage.uvw012',
                        label: null,
                        type: 'document',
                        isImage: false,
                        placeholder: '{{LINK:0}}',
                        metadata: { isJournalReference: true }
                    })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: 'Target content',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('See [[Target]] for details.');
        });

        it('should resolve journal reference with full path in different folder', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: 'See {{LINK:0}} for details.',
                    links: [new Reference({
                        source: '@UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}',
                        foundry: 'JournalEntry.def456.JournalEntryPage.uvw012',
                        label: null,
                        type: 'document',
                        isImage: false,
                        placeholder: '{{LINK:0}}',
                        metadata: { isJournalReference: true }
                    })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Folder/Target.md',
                    lookupKeys: ['Target', 'Folder/Target'],
                    content: 'Target content',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('See [[Folder/Target]] for details.');
        });

        it('should keep journal reference UUID when target not found', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Source.md',
                    lookupKeys: ['Source'],
                    content: 'See {{LINK:0}} for details.',
                    links: [new Reference({
                        source: '@UUID[JournalEntry.missing.JournalEntryPage.xyz]{Missing}',
                        foundry: 'JournalEntry.missing.JournalEntryPage.xyz',
                        label: 'Missing',
                        type: 'document',
                        isImage: false,
                        placeholder: '{{LINK:0}}',
                        metadata: { isJournalReference: true }
                    })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('See [[@UUID[JournalEntry.missing.JournalEntryPage.xyz]|Missing]] for details.');
        });
    });

    describe('non-journal reference resolution', () => {
        it('should format non-journal reference as Obsidian link with UUID', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'Check out {{LINK:0}}.',
                    links: [new Reference({
                        source: '@UUID[Actor.abc123]{Strahd}',
                        foundry: 'Actor.abc123',
                        label: 'Strahd',
                        type: 'document',
                        isImage: false,
                        placeholder: '{{LINK:0}}',
                        metadata: { isJournalReference: false }
                    })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('Check out [[@UUID[Actor.abc123]|Strahd]].');
        });

        it('should format non-journal reference without label using UUID as display', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'Item: {{LINK:0}}',
                    links: [new Reference({
                        source: '@UUID[Item.xyz789]',
                        foundry: 'Item.xyz789',
                        label: null,
                        type: 'document',
                        isImage: false,
                        placeholder: '{{LINK:0}}',
                        metadata: { isJournalReference: false }
                    })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('Item: [[@UUID[Item.xyz789]|Item.xyz789]]');
        });
    });

    describe('asset resolution', () => {
        it('should resolve image asset to markdown format', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'Image: {{ASSET:0}}',
                    links: [],
                    assets: [new Reference({
                        source: '<img src="modules/obsidian-bridge/imported/dragon.png" />',
                        foundry: 'modules/obsidian-bridge/imported/dragon.png',
                        label: 'Dragon',
                        type: 'asset',
                        isImage: true,
                        placeholder: '{{ASSET:0}}'
                    })],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('Image: ![Dragon](modules/obsidian-bridge/imported/dragon.png)');
        });

        it('should resolve non-image asset to markdown link format', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'File: {{ASSET:0}}',
                    links: [],
                    assets: [new Reference({
                        source: '<a href="modules/obsidian-bridge/imported/doc.pdf">Document</a>',
                        foundry: 'modules/obsidian-bridge/imported/doc.pdf',
                        label: 'Document',
                        type: 'asset',
                        isImage: false,
                        placeholder: '{{ASSET:0}}'
                    })],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('File: [Document](modules/obsidian-bridge/imported/doc.pdf)');
        });

        it('should use foundry path as label when label is empty', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'File: {{ASSET:0}}',
                    links: [],
                    assets: [new Reference({
                        source: '<a href="path/to/file.pdf"></a>',
                        foundry: 'path/to/file.pdf',
                        label: '',
                        type: 'asset',
                        isImage: false,
                        placeholder: '{{ASSET:0}}'
                    })],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('File: [path/to/file.pdf](path/to/file.pdf)');
        });
    });

    describe('mixed references', () => {
        it('should resolve journal links, non-journal links, and assets together', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'See {{LINK:0}} and {{LINK:1}} with {{ASSET:0}}',
                    links: [
                        new Reference({
                            source: '@UUID[JournalEntry.def456.JournalEntryPage.uvw012]{Target}',
                            foundry: 'JournalEntry.def456.JournalEntryPage.uvw012',
                            label: null,
                            type: 'document',
                            isImage: false,
                            placeholder: '{{LINK:0}}',
                            metadata: { isJournalReference: true }
                        }),
                        new Reference({
                            source: '@UUID[Actor.abc123]{Strahd}',
                            foundry: 'Actor.abc123',
                            label: 'Strahd',
                            type: 'document',
                            isImage: false,
                            placeholder: '{{LINK:1}}',
                            metadata: { isJournalReference: false }
                        })
                    ],
                    assets: [new Reference({
                        source: '<img src="modules/obsidian-bridge/imported/dragon.png" />',
                        foundry: 'modules/obsidian-bridge/imported/dragon.png',
                        label: '',
                        type: 'asset',
                        isImage: true,
                        placeholder: '{{ASSET:0}}'
                    })],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                }),
                new MarkdownFile({
                    filePath: 'Target.md',
                    lookupKeys: ['Target'],
                    content: 'Target content',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.def456.JournalEntryPage.uvw012'
                })
            ];

            const result = resolveForExport(markdownFiles);

            expect(result[0].content).toBe('See [[Target]] and [[@UUID[Actor.abc123]|Strahd]] with ![](modules/obsidian-bridge/imported/dragon.png)');
        });
    });

    describe('edge cases', () => {
        it('should return empty array for empty markdownFiles', () => {
            const result = resolveForExport([]);
            expect(result).toEqual([]);
        });

        it('should return empty array for null markdownFiles', () => {
            const result = resolveForExport(null);
            expect(result).toEqual([]);
        });

        it('should return empty array for undefined markdownFiles', () => {
            const result = resolveForExport(undefined);
            expect(result).toEqual([]);
        });

        it('should handle file with no links or assets', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'Just plain content',
                    links: [],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);
            expect(result[0].content).toBe('Just plain content');
        });

        it('should handle link without foundry UUID', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'See {{LINK:0}}',
                    links: [new Reference({
                        source: '[[Target]]',
                        obsidian: 'Target',
                        label: null,
                        type: 'document',
                        isImage: false,
                        placeholder: '{{LINK:0}}',
                        metadata: { isJournalReference: true }
                    })],
                    assets: [],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);
            expect(result[0].content).toBe('See [[Target]]');
        });

        it('should handle asset without foundry path', () => {
            const markdownFiles = [
                new MarkdownFile({
                    filePath: 'Document.md',
                    lookupKeys: ['Document'],
                    content: 'Image: {{ASSET:0}}',
                    links: [],
                    assets: [new Reference({
                        source: '![](dragon.png)',
                        obsidian: 'dragon.png',
                        label: '',
                        type: 'asset',
                        isImage: true,
                        placeholder: '{{ASSET:0}}'
                    })],
                    foundryPageUuid: 'JournalEntry.abc123.JournalEntryPage.xyz789'
                })
            ];

            const result = resolveForExport(markdownFiles);
            expect(result[0].content).toBe('Image: ![](dragon.png)');
        });
    });
});
