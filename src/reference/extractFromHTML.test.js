import { describe, it, expect, jest } from '@jest/globals';
import { extractLinkReferences, extractAssetReferences } from './extractFromHTML.js';
import Reference from '../domain/Reference.js';

// Mock fromUuid for tests that don't need it
beforeEach(() => {
    global.fromUuid = jest.fn().mockResolvedValue({ name: 'Mocked Name' });
});

afterEach(() => {
    delete global.fromUuid;
});

describe('extractLinkReferences', () => {
    it('should extract a basic UUID link', async () => {
        const html = '<p>Check out @UUID[Actor.abc123]{Bob the NPC} for details.</p>';
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('@UUID[Actor.abc123]{Bob the NPC}');
        expect(result[0].foundry).toBe('Actor.abc123');
        expect(result[0].obsidian).toBe('');
        expect(result[0].label).toBe('Bob the NPC');
        expect(result[0].type).toBe('document');
        expect(result[0].isImage).toBe(false);
        expect(result[0].metadata.isJournalReference).toBe(false);
    });

    it('should extract a journal entry UUID link', async () => {
        const html = '<p>See @UUID[JournalEntry.xyz789]{Quest Log} here.</p>';
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('@UUID[JournalEntry.xyz789]{Quest Log}');
        expect(result[0].foundry).toBe('JournalEntry.xyz789');
        expect(result[0].label).toBe('Quest Log');
        expect(result[0].metadata.isJournalReference).toBe(true);
    });

    it('should extract a journal entry page UUID link', async () => {
        const html = '<p>Read @UUID[JournalEntry.abc123.JournalEntryPage.def456]{Page Title}.</p>';
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('@UUID[JournalEntry.abc123.JournalEntryPage.def456]{Page Title}');
        expect(result[0].foundry).toBe('JournalEntry.abc123.JournalEntryPage.def456');
        expect(result[0].label).toBe('Page Title');
        expect(result[0].metadata.isJournalReference).toBe(true);
    });

    it('should extract multiple UUID links', async () => {
        const html = '<p>See @UUID[Actor.abc]{Bob} and @UUID[Item.xyz]{Sword}.</p>';
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(2);
        expect(result[0].foundry).toBe('Actor.abc');
        expect(result[0].label).toBe('Bob');
        expect(result[0].metadata.isJournalReference).toBe(false);
        expect(result[1].foundry).toBe('Item.xyz');
        expect(result[1].label).toBe('Sword');
        expect(result[1].metadata.isJournalReference).toBe(false);
    });

    it('should differentiate journal from non-journal UUIDs', async () => {
        const html = `
            <p>@UUID[Actor.abc]{NPC}</p>
            <p>@UUID[JournalEntry.def]{Journal}</p>
            <p>@UUID[Item.ghi]{Item}</p>
            <p>@UUID[Scene.jkl.JournalEntry.mno]{Embedded}</p>
        `;
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(4);
        expect(result[0].metadata.isJournalReference).toBe(false);
        expect(result[1].metadata.isJournalReference).toBe(true);
        expect(result[2].metadata.isJournalReference).toBe(false);
        expect(result[3].metadata.isJournalReference).toBe(true);
    });

    it('should handle empty HTML', async () => {
        expect(await extractLinkReferences('')).toEqual([]);
        expect(await extractLinkReferences(null)).toEqual([]);
        expect(await extractLinkReferences(undefined)).toEqual([]);
    });

    it('should handle HTML with no UUID links', async () => {
        const html = '<p>Just some plain text with no links.</p>';
        const result = await extractLinkReferences(html);

        expect(result).toEqual([]);
    });

    it('should trim whitespace from UUID and label', async () => {
        const html = '<p>@UUID[ Actor.abc123 ]{ Bob the NPC }</p>';
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Actor.abc123');
        expect(result[0].label).toBe('Bob the NPC');
    });

    it('should handle UUIDs with special characters', async () => {
        const html = '<p>@UUID[Compendium.dnd5e.monsters.Actor.abc-123_xyz]{Monster}</p>';
        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Compendium.dnd5e.monsters.Actor.abc-123_xyz');
        expect(result[0].label).toBe('Monster');
    });

    it('should extract UUID without label using document lookup', async () => {
        const html = '<p>See @UUID[Actor.abc123] for details.</p>';
        const mockFromUuid = jest.fn().mockResolvedValue({ name: 'Bob the NPC' });
        global.fromUuid = mockFromUuid;

        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Actor.abc123');
        expect(result[0].label).toBe('Bob the NPC');
        expect(mockFromUuid).toHaveBeenCalledWith('Actor.abc123');

        delete global.fromUuid;
    });

    it('should fall back to UUID as label when document lookup fails', async () => {
        const html = '<p>See @UUID[Actor.deleted123] for details.</p>';
        const mockFromUuid = jest.fn().mockRejectedValue(new Error('Not found'));
        global.fromUuid = mockFromUuid;

        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Actor.deleted123');
        expect(result[0].label).toBe('Actor.deleted123');

        delete global.fromUuid;
    });

    it('should fall back to UUID as label when document has no name', async () => {
        const html = '<p>See @UUID[Actor.noname123] for details.</p>';
        const mockFromUuid = jest.fn().mockResolvedValue({ name: null });
        global.fromUuid = mockFromUuid;

        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Actor.noname123');
        expect(result[0].label).toBe('Actor.noname123');

        delete global.fromUuid;
    });

    it('should treat empty braces as no label and trigger lookup', async () => {
        const html = '<p>See @UUID[Actor.abc123]{} for details.</p>';
        const mockFromUuid = jest.fn().mockResolvedValue({ name: 'Bob' });
        global.fromUuid = mockFromUuid;

        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Actor.abc123');
        expect(result[0].label).toBe('Bob');
        expect(mockFromUuid).toHaveBeenCalledWith('Actor.abc123');

        delete global.fromUuid;
    });

    it('should extract multiple UUIDs with mixed labeled and unlabeled', async () => {
        const html = '<p>@UUID[Actor.abc]{Bob} and @UUID[Item.xyz] here.</p>';
        const mockFromUuid = jest.fn().mockResolvedValue({ name: 'Magic Sword' });
        global.fromUuid = mockFromUuid;

        const result = await extractLinkReferences(html);

        expect(result).toHaveLength(2);
        expect(result[0].foundry).toBe('Actor.abc');
        expect(result[0].label).toBe('Bob');
        expect(result[1].foundry).toBe('Item.xyz');
        expect(result[1].label).toBe('Magic Sword');
        expect(mockFromUuid).toHaveBeenCalledTimes(1);
        expect(mockFromUuid).toHaveBeenCalledWith('Item.xyz');

        delete global.fromUuid;
    });
});

describe('extractAssetReferences', () => {
    it('should extract image src from img tag', () => {
        const html = '<img src="worlds/my-world/maps/dungeon.png" alt="Dungeon Map">';
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].foundry).toBe('worlds/my-world/maps/dungeon.png');
        expect(result[0].obsidian).toBe('worlds/my-world/maps/dungeon.png');
        expect(result[0].label).toBe('Dungeon Map');
        expect(result[0].type).toBe('asset');
        expect(result[0].isImage).toBe(true);
    });

    it('should extract image without alt text', () => {
        const html = '<img src="assets/image.png">';
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('assets/image.png');
        expect(result[0].label).toBeNull();
        expect(result[0].isImage).toBe(true);
    });

    it('should extract anchor href to file', () => {
        const html = '<a href="worlds/my-world/docs/handout.pdf">Download Handout</a>';
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].foundry).toBe('worlds/my-world/docs/handout.pdf');
        expect(result[0].label).toBe('Download Handout');
        expect(result[0].type).toBe('asset');
        expect(result[0].isImage).toBe(false);
    });

    it('should extract multiple assets', () => {
        const html = `
            <img src="image1.png" alt="First">
            <img src="image2.jpg" alt="Second">
            <a href="document.pdf">PDF</a>
        `;
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(3);
        expect(result[0].foundry).toBe('image1.png');
        expect(result[0].isImage).toBe(true);
        expect(result[1].foundry).toBe('image2.jpg');
        expect(result[1].isImage).toBe(true);
        expect(result[2].foundry).toBe('document.pdf');
        expect(result[2].isImage).toBe(false);
    });

    it('should skip external http URLs', () => {
        const html = `
            <img src="http://example.com/image.png" alt="External">
            <img src="https://example.com/image.png" alt="External HTTPS">
            <a href="http://example.com/file.pdf">External Link</a>
            <img src="local/image.png" alt="Local">
        `;
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('local/image.png');
    });

    it('should skip data URIs', () => {
        const html = `
            <img src="data:image/png;base64,iVBORw0KGgoAAAANS" alt="Inline">
            <img src="assets/real.png" alt="Real">
        `;
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('assets/real.png');
    });

    it('should strip asset path prefix when provided', () => {
        const html = '<img src="worlds/my-world/obsidian/maps/dungeon.png" alt="Map">';
        const options = { assetPathPrefix: 'worlds/my-world/obsidian' };
        const result = extractAssetReferences(html, options);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('worlds/my-world/obsidian/maps/dungeon.png');
        expect(result[0].obsidian).toBe('maps/dungeon.png');
    });

    it('should strip asset path prefix with trailing slash', () => {
        const html = '<img src="worlds/my-world/obsidian/maps/dungeon.png" alt="Map">';
        const options = { assetPathPrefix: 'worlds/my-world/obsidian/' };
        const result = extractAssetReferences(html, options);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('worlds/my-world/obsidian/maps/dungeon.png');
        expect(result[0].obsidian).toBe('maps/dungeon.png');
    });

    it('should handle Windows-style backslashes in prefix', () => {
        const html = '<img src="worlds/my-world/obsidian/image.png">';
        const options = { assetPathPrefix: 'worlds\\my-world\\obsidian' };
        const result = extractAssetReferences(html, options);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('worlds/my-world/obsidian/image.png');
        expect(result[0].obsidian).toBe('image.png');
    });

    it('should not strip prefix if path does not match', () => {
        const html = '<img src="other/path/image.png" alt="Image">';
        const options = { assetPathPrefix: 'worlds/my-world' };
        const result = extractAssetReferences(html, options);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('other/path/image.png');
    });

    it('should handle empty assetPathPrefix', () => {
        const html = '<img src="worlds/my-world/image.png" alt="Image">';
        const options = { assetPathPrefix: '' };
        const result = extractAssetReferences(html, options);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('worlds/my-world/image.png');
    });

    it('should deduplicate identical asset paths', () => {
        const html = `
            <img src="image.png" alt="First">
            <img src="image.png" alt="Second">
            <a href="image.png">Download</a>
        `;
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('image.png');
    });

    it('should handle empty HTML', () => {
        expect(extractAssetReferences('')).toEqual([]);
        expect(extractAssetReferences(null)).toEqual([]);
        expect(extractAssetReferences(undefined)).toEqual([]);
    });

    it('should handle HTML with no assets', () => {
        const html = '<p>Just some plain text.</p>';
        const result = extractAssetReferences(html);

        expect(result).toEqual([]);
    });

    it('should handle complex HTML with mixed content', () => {
        const html = `
            <div class="content">
                <p>Text with @UUID[Actor.abc]{Bob}</p>
                <img src="local/map.png" alt="Map" class="map-image">
                <p>More text</p>
                <a href="http://external.com">External</a>
                <a href="local/doc.pdf">Local Doc</a>
            </div>
        `;
        const result = extractAssetReferences(html);

        expect(result).toHaveLength(2);
        expect(result[0].foundry).toBe('local/map.png');
        expect(result[0].isImage).toBe(true);
        expect(result[1].foundry).toBe('local/doc.pdf');
        expect(result[1].isImage).toBe(false);
    });
});
