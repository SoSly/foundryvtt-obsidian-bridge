import replaceWithPlaceholders from './replace.js';
import Reference from '../domain/Reference.js';

describe('replaceWithPlaceholders', () => {
    it('should replace links with placeholders', () => {
        const markdown = 'See [[Dragon]] for details.';
        const links = [
            new Reference({ source: '[[Dragon]]', obsidian: 'Dragon', label: null, type: 'document', metadata: { heading: null, isEmbed: false } })
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
            new Reference({ source: '![alt](dragon.png)', obsidian: 'dragon.png', label: 'alt', type: 'asset', isImage: true, metadata: {} })
        ];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('Image: {{ASSET:0}}');
        expect(result.assets[0].placeholder).toBe('{{ASSET:0}}');
    });

    it('should replace multiple links with numbered placeholders', () => {
        const markdown = 'See [[Dragon]] and [[Goblin]] here.';
        const links = [
            new Reference({ source: '[[Dragon]]', obsidian: 'Dragon', label: null, type: 'document', metadata: { heading: null, isEmbed: false } }),
            new Reference({ source: '[[Goblin]]', obsidian: 'Goblin', label: null, type: 'document', metadata: { heading: null, isEmbed: false } })
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
            new Reference({ source: '[[Dragon]]', obsidian: 'Dragon', label: null, type: 'document', metadata: { heading: null, isEmbed: false } })
        ];
        const assets = [
            new Reference({ source: '![alt](dragon.png)', obsidian: 'dragon.png', label: 'alt', type: 'asset', isImage: true, metadata: {} })
        ];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('See {{LINK:0}} and this image: {{ASSET:0}}');
        expect(result.links[0].placeholder).toBe('{{LINK:0}}');
        expect(result.assets[0].placeholder).toBe('{{ASSET:0}}');
    });

    it('should replace longer patterns first to avoid partial matches', () => {
        const markdown = '[[Dragon Lair]] and [[Dragon]]';
        const links = [
            new Reference({ source: '[[Dragon]]', obsidian: 'Dragon', label: null, type: 'document', metadata: { heading: null, isEmbed: false } }),
            new Reference({ source: '[[Dragon Lair]]', obsidian: 'Dragon Lair', label: null, type: 'document', metadata: { heading: null, isEmbed: false } })
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('{{LINK:1}} and {{LINK:0}}');
    });

    it('should handle all occurrences of the same pattern', () => {
        const markdown = '[[Dragon]] here and [[Dragon]] there.';
        const links = [
            new Reference({ source: '[[Dragon]]', obsidian: 'Dragon', label: null, type: 'document', metadata: { heading: null, isEmbed: false } })
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.text).toBe('{{LINK:0}} here and {{LINK:0}} there.');
    });

    it('should preserve original link and asset data', () => {
        const markdown = 'See [[Dragon|the beast]]';
        const links = [
            new Reference({ source: '[[Dragon|the beast]]', obsidian: 'Dragon', label: 'the beast', type: 'document', metadata: { heading: null, isEmbed: false } })
        ];
        const assets = [];

        const result = replaceWithPlaceholders(markdown, links, assets);

        expect(result.links[0]).toBeInstanceOf(Reference);
        expect(result.links[0].source).toBe('[[Dragon|the beast]]');
        expect(result.links[0].obsidian).toBe('Dragon');
        expect(result.links[0].label).toBe('the beast');
        expect(result.links[0].placeholder).toBe('{{LINK:0}}');
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
            new Reference({ source: '[[Dragons/Ancient Red Dragon]]', obsidian: 'Dragons/Ancient Red Dragon', label: null, type: 'document', metadata: { heading: null, isEmbed: false } }),
            new Reference({ source: '[[Dragons/Ancient Red Dragon#Abilities|dragon abilities]]', obsidian: 'Dragons/Ancient Red Dragon', label: 'dragon abilities', type: 'document', metadata: { heading: 'Abilities', isEmbed: false } })
        ];

        const assets = [
            new Reference({ source: '![Dragon](assets/dragon.png)', obsidian: 'assets/dragon.png', label: 'Dragon', type: 'asset', isImage: true, metadata: {} }),
            new Reference({ source: '![[map.png]]', obsidian: 'map.png', label: null, type: 'asset', isImage: true, metadata: {} })
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
