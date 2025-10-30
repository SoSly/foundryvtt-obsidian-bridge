import replaceWithPlaceholders from '../../../src/usecase/import/replaceWithPlaceholders.js';

describe('replaceWithPlaceholders', () => {
    it('should replace links with placeholders', () => {
        const markdown = 'See [[Dragon]] for details.';
        const links = [
            { obsidianTarget: 'Dragon', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragon]]' }
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('See {{LINK:0}} for details.');
        expect(result.links[0].placeholder).toBe('{{LINK:0}}');
    });

    it('should replace assets with placeholders', () => {
        const markdown = 'Image: ![alt](dragon.png)';
        const links = [];
        const assets = [
            { obsidianPath: 'dragon.png', originalText: '![alt](dragon.png)' }
        ];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('Image: {{ASSET:0}}');
        expect(result.assets[0].placeholder).toBe('{{ASSET:0}}');
    });

    it('should replace multiple links with numbered placeholders', () => {
        const markdown = 'See [[Dragon]] and [[Goblin]] here.';
        const links = [
            { obsidianTarget: 'Dragon', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragon]]' },
            { obsidianTarget: 'Goblin', displayText: null, heading: null, isEmbed: false, originalText: '[[Goblin]]' }
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('See {{LINK:0}} and {{LINK:1}} here.');
        expect(result.links[0].placeholder).toBe('{{LINK:0}}');
        expect(result.links[1].placeholder).toBe('{{LINK:1}}');
    });

    it('should replace both links and assets', () => {
        const markdown = 'See [[Dragon]] and this image: ![alt](dragon.png)';
        const links = [
            { obsidianTarget: 'Dragon', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragon]]' }
        ];
        const assets = [
            { obsidianPath: 'dragon.png', originalText: '![alt](dragon.png)' }
        ];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('See {{LINK:0}} and this image: {{ASSET:0}}');
        expect(result.links[0].placeholder).toBe('{{LINK:0}}');
        expect(result.assets[0].placeholder).toBe('{{ASSET:0}}');
    });

    it('should replace longer patterns first to avoid partial matches', () => {
        const markdown = '[[Dragon Lair]] and [[Dragon]]';
        const links = [
            { obsidianTarget: 'Dragon', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragon]]' },
            { obsidianTarget: 'Dragon Lair', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragon Lair]]' }
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('{{LINK:1}} and {{LINK:0}}');
    });

    it('should handle all occurrences of the same pattern', () => {
        const markdown = '[[Dragon]] here and [[Dragon]] there.';
        const links = [
            { obsidianTarget: 'Dragon', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragon]]' }
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('{{LINK:0}} here and {{LINK:0}} there.');
    });

    it('should preserve original link and asset data', () => {
        const markdown = 'See [[Dragon|the beast]]';
        const links = [
            { obsidianTarget: 'Dragon', displayText: 'the beast', heading: null, isEmbed: false, originalText: '[[Dragon|the beast]]' }
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.links[0]).toEqual({
            obsidianTarget: 'Dragon',
            displayText: 'the beast',
            heading: null,
            isEmbed: false,
            originalText: '[[Dragon|the beast]]',
            placeholder: '{{LINK:0}}'
        });
    });

    it('should handle empty links and assets arrays', () => {
        const markdown = 'Just plain text.';
        const result = replaceWithPlaceholders(markdown, [], []);

        expect(result.text).toBe('Just plain text.');
        expect(result.links).toEqual([]);
        expect(result.assets).toEqual([]);
    });

    it('should handle empty markdown text', () => {
        const result = replaceWithPlaceholders('', [], []);

        expect(result.text).toBe('');
        expect(result.links).toEqual([]);
        expect(result.assets).toEqual([]);
    });

    it('should handle null markdown text', () => {
        const result = replaceWithPlaceholders(null, [], []);

        expect(result.text).toBe('');
        expect(result.links).toEqual([]);
        expect(result.assets).toEqual([]);
    });

    it('should handle complex mixed content', () => {
        const markdown = `
# Dragon Guide

See [[Dragons/Ancient Red Dragon]] for the stat block.
Also check [[Dragons/Ancient Red Dragon#Abilities|dragon abilities]].

Image: ![Dragon](assets/dragon.png)
Embedded: ![[map.png]]
`;

        const links = [
            { obsidianTarget: 'Dragons/Ancient Red Dragon', displayText: null, heading: null, isEmbed: false, originalText: '[[Dragons/Ancient Red Dragon]]' },
            { obsidianTarget: 'Dragons/Ancient Red Dragon', displayText: 'dragon abilities', heading: 'Abilities', isEmbed: false, originalText: '[[Dragons/Ancient Red Dragon#Abilities|dragon abilities]]' }
        ];

        const assets = [
            { obsidianPath: 'assets/dragon.png', originalText: '![Dragon](assets/dragon.png)' },
            { obsidianPath: 'map.png', originalText: '![[map.png]]' }
        ];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toContain('{{LINK:0}}');
        expect(result.text).toContain('{{LINK:1}}');
        expect(result.text).toContain('{{ASSET:0}}');
        expect(result.text).toContain('{{ASSET:1}}');
        expect(result.text).not.toContain('[[');
        expect(result.text).not.toContain('![[');
        expect(result.links).toHaveLength(2);
        expect(result.assets).toHaveLength(2);
    });
});
