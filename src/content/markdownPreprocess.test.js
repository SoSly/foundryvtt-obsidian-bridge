import { describe, it, expect } from '@jest/globals';
import convertNewlinesToBr from './markdownPreprocess.js';

describe('convertNewlinesToBr', () => {
    it('should convert single newline between content lines to br tag', () => {
        const input = 'line1\nline2';
        expect(convertNewlinesToBr(input)).toBe('line1<br />\nline2');
    });

    it('should NOT convert paragraph breaks (double newlines)', () => {
        const input = 'paragraph1\n\nparagraph2';
        expect(convertNewlinesToBr(input)).toBe('paragraph1\n\nparagraph2');
    });

    it('should NOT convert when next line is blank', () => {
        const input = 'line1\n\nline2';
        expect(convertNewlinesToBr(input)).toBe('line1\n\nline2');
    });

    it('should pass through content with no newlines unchanged', () => {
        const input = 'single line content';
        expect(convertNewlinesToBr(input)).toBe('single line content');
    });

    it('should NOT convert newlines inside fenced code blocks with backticks', () => {
        const input = '```\ncode line 1\ncode line 2\n```';
        expect(convertNewlinesToBr(input)).toBe('```\ncode line 1\ncode line 2\n```');
    });

    it('should NOT convert newlines inside fenced code blocks with tildes', () => {
        const input = '~~~\ncode line 1\ncode line 2\n~~~';
        expect(convertNewlinesToBr(input)).toBe('~~~\ncode line 1\ncode line 2\n~~~');
    });

    it('should resume converting after code block ends', () => {
        const input = 'before\n```\ncode\n```\nafter1\nafter2';
        expect(convertNewlinesToBr(input)).toBe('before<br />\n```\ncode\n```<br />\nafter1<br />\nafter2');
    });

    it('should handle Windows line endings', () => {
        const input = 'line1\r\nline2';
        expect(convertNewlinesToBr(input)).toBe('line1<br />\nline2');
    });

    it('should handle multiple consecutive content lines', () => {
        const input = '**Walls:** Wood.\n**Furniture:** Difficult terrain.\n**Lighting:** Dim.';
        expect(convertNewlinesToBr(input)).toBe('**Walls:** Wood.<br />\n**Furniture:** Difficult terrain.<br />\n**Lighting:** Dim.');
    });

    it('should NOT add br to last line of content', () => {
        const input = 'line1\nline2\nline3';
        const result = convertNewlinesToBr(input);
        expect(result).toBe('line1<br />\nline2<br />\nline3');
        expect(result).not.toMatch(/<br \/>$/);
    });

    it('should handle blank line followed by content', () => {
        const input = 'line1\n\nline2\nline3';
        expect(convertNewlinesToBr(input)).toBe('line1\n\nline2<br />\nline3');
    });

    it('should handle code block with language specifier', () => {
        const input = '```javascript\nconst x = 1;\nconst y = 2;\n```';
        expect(convertNewlinesToBr(input)).toBe('```javascript\nconst x = 1;\nconst y = 2;\n```');
    });

    it('should return empty string for falsy input', () => {
        expect(convertNewlinesToBr('')).toBe('');
        expect(convertNewlinesToBr(null)).toBe('');
        expect(convertNewlinesToBr(undefined)).toBe('');
    });

    it('should handle indented code block markers', () => {
        const input = 'text\n  ```\n  code\n  ```\nmore text';
        expect(convertNewlinesToBr(input)).toBe('text<br />\n  ```\n  code\n  ```<br />\nmore text');
    });

    it('should not add br to callout placeholder lines', () => {
        const input = 'Some text\n{{CALLOUT:0}}\nMore text';
        const result = convertNewlinesToBr(input);
        expect(result).not.toContain('{{CALLOUT:0}}<br />');
        expect(result).toContain('Some text<br />');
    });

    it('should handle callout placeholder between content lines', () => {
        const input = 'First line\n{{CALLOUT:0}}\nLast line';
        const result = convertNewlinesToBr(input);
        // Line before placeholder gets br (content followed by content)
        // Placeholder itself does NOT get br (it's a callout placeholder)
        // Last line has no next line so no br
        expect(result).toBe('First line<br />\n{{CALLOUT:0}}\nLast line');
    });

    it('should handle multiple callout placeholders', () => {
        const input = 'Text\n{{CALLOUT:0}}\nMiddle\n{{CALLOUT:1}}\nEnd';
        const result = convertNewlinesToBr(input);
        // Text gets br (followed by placeholder which has content after)
        // CALLOUT:0 does NOT get br (it's a placeholder)
        // Middle gets br (followed by placeholder which has content after)
        // CALLOUT:1 does NOT get br (it's a placeholder)
        // End has no next line so no br
        expect(result).toBe('Text<br />\n{{CALLOUT:0}}\nMiddle<br />\n{{CALLOUT:1}}\nEnd');
    });
});
