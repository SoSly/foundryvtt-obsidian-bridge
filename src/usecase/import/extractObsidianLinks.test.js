import extractObsidianLinks from '../../../src/usecase/import/extractObsidianLinks.js';

describe('extractObsidianLinks', () => {
    it('should extract a basic wiki link', () => {
        const markdown = 'Check out [[Ancient Red Dragon]] for details.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: null,
            heading: null,
            isEmbed: false,
            originalText: '[[Ancient Red Dragon]]'
        });
    });

    it('should extract a link with display text', () => {
        const markdown = 'See [[Ancient Red Dragon|the dragon]] for more.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: 'the dragon',
            heading: null,
            isEmbed: false,
            originalText: '[[Ancient Red Dragon|the dragon]]'
        });
    });

    it('should extract a link with heading', () => {
        const markdown = 'Check [[Ancient Red Dragon#Abilities]] section.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: null,
            heading: 'Abilities',
            isEmbed: false,
            originalText: '[[Ancient Red Dragon#Abilities]]'
        });
    });

    it('should extract a link with heading and display text', () => {
        const markdown = 'Read [[Ancient Red Dragon#Abilities|dragon abilities]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: 'dragon abilities',
            heading: 'Abilities',
            isEmbed: false,
            originalText: '[[Ancient Red Dragon#Abilities|dragon abilities]]'
        });
    });

    it('should extract an embedded note', () => {
        const markdown = 'Here is the content: ![[Ancient Red Dragon]]';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: null,
            heading: null,
            isEmbed: true,
            originalText: '![[Ancient Red Dragon]]'
        });
    });

    it('should extract an embedded note with display text', () => {
        const markdown = 'Content: ![[Ancient Red Dragon|Dragon Info]]';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: 'Dragon Info',
            heading: null,
            isEmbed: true,
            originalText: '![[Ancient Red Dragon|Dragon Info]]'
        });
    });

    it('should strip .md extension from target', () => {
        const markdown = 'See [[Ancient Red Dragon.md]] for details.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidianTarget).toBe('Ancient Red Dragon');
    });

    it('should strip .md extension from target with path', () => {
        const markdown = 'Check [[Combat/Dragons/Ancient Red Dragon.md]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidianTarget).toBe('Combat/Dragons/Ancient Red Dragon');
    });

    it('should extract multiple links', () => {
        const markdown = 'See [[Dragon]] and [[Goblin]] for creatures.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(2);
        expect(result[0].obsidianTarget).toBe('Dragon');
        expect(result[1].obsidianTarget).toBe('Goblin');
    });

    it('should extract links with paths', () => {
        const markdown = 'Check [[Combat/Dragons/Ancient Red Dragon]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidianTarget).toBe('Combat/Dragons/Ancient Red Dragon');
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
        expect(result[0].obsidianTarget).toBe('Bob\'s Tavern');
    });

    it('should handle links with spaces', () => {
        const markdown = 'See [[Ancient Red Dragon]] here.';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].obsidianTarget).toBe('Ancient Red Dragon');
    });

    it('should handle headings with spaces', () => {
        const markdown = 'Read [[Dragon#Breath Weapon]].';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0].heading).toBe('Breath Weapon');
    });

    it('should extract embedded markdown notes', () => {
        const markdown = 'Here is the content: ![[Ancient Red Dragon.md]]';
        const result = extractObsidianLinks(markdown);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            obsidianTarget: 'Ancient Red Dragon',
            displayText: null,
            heading: null,
            isEmbed: true,
            originalText: '![[Ancient Red Dragon.md]]'
        });
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
        expect(result[0].obsidianTarget).toBe('Ancient Red Dragon');
        expect(result[0].isEmbed).toBe(true);
    });

    it('should not extract markdown links', () => {
        const markdown = 'Click [here](https://example.com) for more.';
        const result = extractObsidianLinks(markdown);

        expect(result).toEqual([]);
    });
});
