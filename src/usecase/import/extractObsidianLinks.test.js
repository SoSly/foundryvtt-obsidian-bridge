import extractObsidianLinks from '../../../src/usecase/import/extractObsidianLinks.js';
import Reference from '../../../src/domain/Reference.js';

describe('extractObsidianLinks', () => {
    it('should extract a basic wiki link', () => {
        const markdown = 'Check out [[Ancient Red Dragon]] for details.';
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
    });

    it('should strip .md extension from target with path', () => {
        const markdown = 'Check [[Combat/Dragons/Ancient Red Dragon.md]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Combat/Dragons/Ancient Red Dragon');
    });

    it('should extract multiple links', () => {
        const markdown = 'See [[Dragon]] and [[Goblin]] for creatures.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(2);
        expect(result[0].obsidian).toBe('Dragon');
        expect(result[1].obsidian).toBe('Goblin');
    });

    it('should extract links with paths', () => {
        const markdown = 'Check [[Combat/Dragons/Ancient Red Dragon]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Combat/Dragons/Ancient Red Dragon');
    });

    it('should return empty array for text with no links', () => {
        const markdown = 'This is just plain text with no links.';
        const result = extractObsidianLinks(markdown);

        expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
        const result = extractObsidianLinks('');
        expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
        const result = extractObsidianLinks(null);
        expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
        const result = extractObsidianLinks(undefined);
        expect(result).toEqual([]);
    });

    it('should handle links with special characters in target', () => {
        const markdown = 'Visit [[Bob\'s Tavern]] tonight.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Bob\'s Tavern');
    });

    it('should handle links with spaces', () => {
        const markdown = 'See [[Ancient Red Dragon]] here.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
    });

    it('should handle headings with spaces', () => {
        const markdown = 'Read [[Dragon#Breath Weapon]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].metadata.heading).toBe('Breath Weapon');
    });

    it('should extract embedded markdown notes', () => {
        const markdown = 'Here is the content: ![[Ancient Red Dragon.md]]';
        const result = extractObsidianLinks(markdown);

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
        const result = extractObsidianLinks(markdown);

        expect(result).toEqual([]);
    });

    it('should skip embedded files with extensions but keep embedded notes', () => {
        const markdown = 'Note: ![[Ancient Red Dragon]] and image: ![[dragon.png]]';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidian).toBe('Ancient Red Dragon');
        expect(result[0].metadata.isEmbed).toBe(true);
    });

    it('should not extract markdown links', () => {
        const markdown = 'Click [here](https://example.com) for more.';
        const result = extractObsidianLinks(markdown);

        expect(result).toEqual([]);
    });
});
