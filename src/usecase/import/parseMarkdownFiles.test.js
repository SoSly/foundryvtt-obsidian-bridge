import parseMarkdownFiles from '../../../src/usecase/import/parseMarkdownFiles.js';

function createMockFile(webkitRelativePath, content) {
    return {
        webkitRelativePath,
        text: async () => content
    };
}

function createMockShowdownConverter() {
    return {
        makeHtml: markdown => `<p>${markdown}</p>`
    };
}

describe('parseMarkdownFiles', () => {
    it('should parse a single markdown file', async () => {
        const files = [
            createMockFile('Dragons/Ancient Red Dragon.md', '# Ancient Red Dragon\n\nA powerful dragon.')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe('Dragons/Ancient Red Dragon.md');
        expect(result[0].lookupKeys).toEqual(['Ancient Red Dragon', 'Dragons/Ancient Red Dragon']);
        expect(result[0].content).toContain('Ancient Red Dragon');
        expect(result[0].links).toEqual([]);
        expect(result[0].assets).toEqual([]);
        expect(result[0].foundryPageUuid).toBeNull();
    });

    it('should extract and replace links with placeholders', async () => {
        const files = [
            createMockFile('Combat.md', 'See [[Ancient Red Dragon]] for details.')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(1);
        expect(result[0].content).toContain('{{LINK:0}}');
        expect(result[0].content).not.toContain('[[Ancient Red Dragon]]');
        expect(result[0].links).toHaveLength(1);
        expect(result[0].links[0].obsidianTarget).toBe('Ancient Red Dragon');
        expect(result[0].links[0].placeholder).toBe('{{LINK:0}}');
    });

    it('should extract and replace assets with placeholders', async () => {
        const files = [
            createMockFile('Guide.md', 'Image: ![Dragon](dragon.png)')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(1);
        expect(result[0].content).toContain('{{ASSET:0}}');
        expect(result[0].assets).toHaveLength(1);
        expect(result[0].assets[0].obsidianPath).toBe('dragon.png');
        expect(result[0].assets[0].placeholder).toBe('{{ASSET:0}}');
    });

    it('should handle files with both links and assets', async () => {
        const files = [
            createMockFile('Guide.md', 'See [[Dragon]] and this ![image](dragon.png)')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(1);
        expect(result[0].content).toContain('{{LINK:0}}');
        expect(result[0].content).toContain('{{ASSET:0}}');
        expect(result[0].links).toHaveLength(1);
        expect(result[0].assets).toHaveLength(1);
    });

    it('should parse multiple files', async () => {
        const files = [
            createMockFile('Dragon.md', '# Dragon'),
            createMockFile('Goblin.md', '# Goblin'),
            createMockFile('Creatures/Troll.md', '# Troll')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(3);
        expect(result[0].filePath).toBe('Dragon.md');
        expect(result[1].filePath).toBe('Goblin.md');
        expect(result[2].filePath).toBe('Creatures/Troll.md');
    });

    it('should generate correct lookup keys for nested files', async () => {
        const files = [
            createMockFile('Combat/Dragons/Ancient Red Dragon.md', '# Dragon')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result[0].lookupKeys).toEqual([
            'Ancient Red Dragon',
            'Dragons/Ancient Red Dragon',
            'Combat/Dragons/Ancient Red Dragon'
        ]);
    });

    it('should handle links with display text and headings', async () => {
        const files = [
            createMockFile('Guide.md', 'See [[Dragon#Abilities|dragon stats]] here.')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result[0].links).toHaveLength(1);
        expect(result[0].links[0].obsidianTarget).toBe('Dragon');
        expect(result[0].links[0].displayText).toBe('dragon stats');
        expect(result[0].links[0].heading).toBe('Abilities');
    });

    it('should handle embedded notes', async () => {
        const files = [
            createMockFile('Guide.md', 'Content: ![[Dragon Stats]]')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result[0].links).toHaveLength(1);
        expect(result[0].links[0].isEmbed).toBe(true);
    });

    it('should return empty array for no files', async () => {
        const converter = createMockShowdownConverter();
        const result = await parseMarkdownFiles(converter, []);

        expect(result).toEqual([]);
    });

    it('should return empty array for null files', async () => {
        const converter = createMockShowdownConverter();
        const result = await parseMarkdownFiles(converter, null);

        expect(result).toEqual([]);
    });

    it('should return empty array for null converter', async () => {
        const files = [createMockFile('Test.md', '# Test')];
        const result = await parseMarkdownFiles(null, files);

        expect(result).toEqual([]);
    });

    it('should handle empty file content', async () => {
        const files = [
            createMockFile('Empty.md', '')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(1);
        expect(result[0].content).toBeTruthy();
        expect(result[0].links).toEqual([]);
        expect(result[0].assets).toEqual([]);
    });

    it('should handle complex markdown with multiple links and assets', async () => {
        const markdown = `
# Dragon Guide

## Overview
See [[Dragons/Ancient Red Dragon]] for details.
Also check [[Dragons/Ancient Red Dragon#Abilities|abilities]].

## Images
![Dragon](assets/dragon.png)
![[map.png]]

## Related
- [[Goblin]]
- [[Troll]]
`;

        const files = [createMockFile('Guide.md', markdown)];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result).toHaveLength(1);
        expect(result[0].links.length).toBeGreaterThan(2);
        expect(result[0].assets.length).toBeGreaterThan(0);
        expect(result[0].content).toContain('{{LINK:');
        expect(result[0].content).toContain('{{ASSET:');
    });

    it('should strip .md extension from targets in links', async () => {
        const files = [
            createMockFile('Guide.md', 'See [[Dragon.md]] here.')
        ];
        const converter = createMockShowdownConverter();

        const result = await parseMarkdownFiles(converter, files);

        expect(result[0].links[0].obsidianTarget).toBe('Dragon');
    });
});
