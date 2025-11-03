import extractAssetReferences from '../../../src/usecase/import/extractAssetReferences.js';
import Reference from '../../../src/domain/Reference.js';

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
});
