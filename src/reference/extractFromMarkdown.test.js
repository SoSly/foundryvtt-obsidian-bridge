import { extractLinkReferences, extractAssetReferences } from './extractFromMarkdown.js';
import Reference from '../domain/Reference.js';

describe('extractLinkReferences', () => {
    it('should extract a basic wiki link', () => {
        const markdown = 'Check out [[Ancient Red Dragon]] for details.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[[Ancient Red Dragon]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBeNull();
        expect(result[0].type).toBe('document');
        expect(result[0].isImage).toBe(false);
        expect(result[0].metadata.heading).toBeNull();
        expect(result[0].metadata.isEmbed).toBe(false);
    });

    it('should extract a link with display text', () => {
        const markdown = 'See [[Ancient Red Dragon|the dragon]] for more.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[[Ancient Red Dragon|the dragon]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBe('the dragon');
        expect(result[0].metadata.heading).toBeNull();
        expect(result[0].metadata.isEmbed).toBe(false);
    });

    it('should extract a link with heading', () => {
        const markdown = 'Check [[Ancient Red Dragon#Abilities]] section.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[[Ancient Red Dragon#Abilities]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBeNull();
        expect(result[0].metadata.heading).toBe('Abilities');
        expect(result[0].metadata.isEmbed).toBe(false);
    });

    it('should extract a link with heading and display text', () => {
        const markdown = 'Read [[Ancient Red Dragon#Abilities|dragon abilities]].';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[[Ancient Red Dragon#Abilities|dragon abilities]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBe('dragon abilities');
        expect(result[0].metadata.heading).toBe('Abilities');
        expect(result[0].metadata.isEmbed).toBe(false);
    });

    it('should extract an embedded note', () => {
        const markdown = 'Here is the content: ![[Ancient Red Dragon]]';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('![[Ancient Red Dragon]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBeNull();
        expect(result[0].metadata.heading).toBeNull();
        expect(result[0].metadata.isEmbed).toBe(true);
    });

    it('should extract an embedded note with display text', () => {
        const markdown = 'Content: ![[Ancient Red Dragon|Dragon Info]]';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('![[Ancient Red Dragon|Dragon Info]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBe('Dragon Info');
        expect(result[0].metadata.heading).toBeNull();
        expect(result[0].metadata.isEmbed).toBe(true);
    });

    it('should strip .md extension from target', () => {
        const markdown = 'See [[Ancient Red Dragon.md]] for details.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
    });

    it('should strip .md extension from target with path', () => {
        const markdown = 'Check [[Combat/Dragons/Ancient Red Dragon.md]].';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Combat/Dragons/Ancient Red Dragon');
    });

    it('should extract multiple links', () => {
        const markdown = 'See [[Dragon]] and [[Goblin]] for creatures.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(2);
        expect(result[0].obsidian).toBe('Dragon');
        expect(result[1].obsidian).toBe('Goblin');
    });

    it('should extract links with paths', () => {
        const markdown = 'Check [[Combat/Dragons/Ancient Red Dragon]].';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Combat/Dragons/Ancient Red Dragon');
    });

    it('should return empty array for text with no links', () => {
        const markdown = 'This is just plain text with no links.';
        const result = extractLinkReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
        const result = extractLinkReferences('');
        expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
        const result = extractLinkReferences(null);
        expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
        const result = extractLinkReferences(undefined);
        expect(result).toEqual([]);
    });

    it('should handle links with special characters in target', () => {
        const markdown = 'Visit [[Bob\'s Tavern]] tonight.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Bob\'s Tavern');
    });

    it('should handle links with spaces', () => {
        const markdown = 'See [[Ancient Red Dragon]] here.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
    });

    it('should handle headings with spaces', () => {
        const markdown = 'Read [[Dragon#Breath Weapon]].';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].metadata.heading).toBe('Breath Weapon');
    });

    it('should extract embedded markdown notes', () => {
        const markdown = 'Here is the content: ![[Ancient Red Dragon.md]]';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('![[Ancient Red Dragon.md]]');
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].label).toBeNull();
        expect(result[0].metadata.heading).toBeNull();
        expect(result[0].metadata.isEmbed).toBe(true);
    });

    it('should skip embedded images and non-markdown files', () => {
        const markdown = 'Image: ![[dragon.webp]] and PDF: ![[document.pdf]]';
        const result = extractLinkReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should skip embedded files with extensions but keep embedded notes', () => {
        const markdown = 'Note: ![[Ancient Red Dragon]] and image: ![[dragon.png]]';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].metadata.isEmbed).toBe(true);
    });

    it('should not extract markdown links', () => {
        const markdown = 'Click [here](https://example.com) for more.';
        const result = extractLinkReferences(markdown);

        expect(result).toEqual([]);
    });
});

describe('extractAssetReferences', () => {
    it('should extract markdown image syntax', () => {
        const markdown = 'Here is an image: ![Dragon](dragon.png)';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('![Dragon](dragon.png)');
        expect(result[0].obsidian).toBe('dragon.png');
        expect(result[0].label).toBe('Dragon');
        expect(result[0].type).toBe('asset');
        expect(result[0].isImage).toBe(true);
    });

    it('should extract markdown link to PDF', () => {
        const markdown = 'Download the [rulebook](rules.pdf) here.';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[rulebook](rules.pdf)');
        expect(result[0].obsidian).toBe('rules.pdf');
        expect(result[0].label).toBe('rulebook');
        expect(result[0].type).toBe('asset');
        expect(result[0].isImage).toBe(false);
    });

    it('should extract Obsidian embedded image', () => {
        const markdown = 'Look at this: ![[dragon.png]]';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('![[dragon.png]]');
        expect(result[0].obsidian).toBe('dragon.png');
        expect(result[0].label).toBeNull();
        expect(result[0].type).toBe('asset');
        expect(result[0].isImage).toBe(true);
    });

    it('should extract Obsidian link to file', () => {
        const markdown = 'See [[rules.pdf]] for details.';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[[rules.pdf]]');
        expect(result[0].obsidian).toBe('rules.pdf');
        expect(result[0].label).toBeNull();
        expect(result[0].type).toBe('asset');
        expect(result[0].isImage).toBe(false);
    });

    it('should extract assets with paths', () => {
        const markdown = 'Image: ![alt](assets/images/dragon.png)';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('assets/images/dragon.png');
    });

    it('should extract multiple assets', () => {
        const markdown = 'See ![img1](a.png) and ![img2](b.jpg) here.';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(2);
        expect(result[0].obsidian).toBe('a.png');
        expect(result[1].obsidian).toBe('b.jpg');
    });

    it('should not extract markdown file links', () => {
        const markdown = 'See [[Ancient Red Dragon.md]] for details.';
        const result = extractAssetReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should not extract Obsidian wiki links without extension', () => {
        const markdown = 'Check [[Ancient Red Dragon]] here.';
        const result = extractAssetReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should extract various file types', () => {
        const markdown = `
      Images: ![](a.png) ![](b.jpg) ![](c.gif)
      Documents: [pdf](d.pdf) [docx](e.docx)
      Audio: ![[audio.mp3]]
      Video: ![[video.mp4]]
    `;
        const result = extractAssetReferences(markdown);

        expect(result.length).toBeGreaterThan(5);
        expect(result.some(a => a.obsidian === 'a.png')).toBe(true);
        expect(result.some(a => a.obsidian === 'd.pdf')).toBe(true);
        expect(result.some(a => a.obsidian === 'audio.mp3')).toBe(true);
    });

    it('should return empty array for text with no assets', () => {
        const markdown = 'Just plain text with no assets.';
        const result = extractAssetReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
        const result = extractAssetReferences('');
        expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
        const result = extractAssetReferences(null);
        expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
        const result = extractAssetReferences(undefined);
        expect(result).toEqual([]);
    });

    it('should not extract external URLs', () => {
        const markdown = 'Link: [example](https://example.com/file.pdf)';
        const result = extractAssetReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should not extract regular markdown links to websites', () => {
        const markdown = 'Visit [Google](https://google.com) for search.';
        const result = extractAssetReferences(markdown);

        expect(result).toEqual([]);
    });

    it('should skip foundry:// URLs in asset extraction', () => {
        const markdown = 'See [Bob](foundry://Actor.abc123) and [Dragon](dragon.png)';
        const result = extractAssetReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('dragon.png');
    });
});

describe('extractLinkReferences - foundry:// protocol', () => {
    it('should extract foundry:// link with label', () => {
        const markdown = 'See [Bob the NPC](foundry://Actor.abc123) for details.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Reference);
        expect(result[0].source).toBe('[Bob the NPC](foundry://Actor.abc123)');
        expect(result[0].foundry).toBe('Actor.abc123');
        expect(result[0].label).toBe('Bob the NPC');
        expect(result[0].type).toBe('document');
        expect(result[0].isImage).toBe(false);
        expect(result[0].metadata.isFoundryProtocol).toBe(true);
    });

    it('should extract multi-word labels from foundry:// links', () => {
        const markdown = 'Check [The Ancient Red Dragon of Doom](foundry://Actor.xyz789) here.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('The Ancient Red Dragon of Doom');
        expect(result[0].foundry).toBe('Actor.xyz789');
        expect(result[0].metadata.isFoundryProtocol).toBe(true);
    });

    it('should extract labels with special characters from foundry:// links', () => {
        const markdown = 'See [Bob\'s Magic Sword (Legendary)](foundry://Item.abc123) here.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('Bob\'s Magic Sword (Legendary)');
        expect(result[0].foundry).toBe('Item.abc123');
    });

    it('should extract multiple foundry:// links', () => {
        const markdown = 'See [Bob](foundry://Actor.abc) and [Sword](foundry://Item.xyz) here.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(2);
        expect(result[0].foundry).toBe('Actor.abc');
        expect(result[0].label).toBe('Bob');
        expect(result[0].metadata.isFoundryProtocol).toBe(true);
        expect(result[1].foundry).toBe('Item.xyz');
        expect(result[1].label).toBe('Sword');
        expect(result[1].metadata.isFoundryProtocol).toBe(true);
    });

    it('should extract both wiki-links and foundry:// links from mixed content', () => {
        const markdown = 'See [[Quest Log]] and [Bob](foundry://Actor.abc123) for details.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(2);

        const wikiLink = result.find(r => r.obsidian === 'Quest Log');
        expect(wikiLink).toBeDefined();
        expect(wikiLink.metadata.isFoundryProtocol).toBeUndefined();

        const foundryLink = result.find(r => r.foundry === 'Actor.abc123');
        expect(foundryLink).toBeDefined();
        expect(foundryLink.metadata.isFoundryProtocol).toBe(true);
    });

    it('should extract Compendium UUIDs from foundry:// links', () => {
        const markdown = 'See [Goblin](foundry://Compendium.dnd5e.monsters.Actor.xyz) here.';
        const result = extractLinkReferences(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].foundry).toBe('Compendium.dnd5e.monsters.Actor.xyz');
        expect(result[0].label).toBe('Goblin');
        expect(result[0].metadata.isFoundryProtocol).toBe(true);
    });
});
