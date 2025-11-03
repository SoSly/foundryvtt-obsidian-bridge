import { describe, it, expect, beforeEach } from '@jest/globals';
import convertHtmlToMarkdown from './htmlToMarkdown.js';

describe('convertHtmlToMarkdown', () => {
    let converter;

    beforeEach(() => {
        converter = {
            makeMarkdown: html => {
                if (!html) {
                    return '';
                }
                return `[CONVERTED: ${html}]`;
            }
        };
    });

    it('should call makeMarkdown on the converter', () => {
        const html = '<h1>Title</h1>';
        const result = convertHtmlToMarkdown(html, converter);

        expect(result).toBe('[CONVERTED: <h1>Title</h1>]');
    });

    it('should pass through HTML content to converter', () => {
        const html = '<p>This is a paragraph.</p>';
        const result = convertHtmlToMarkdown(html, converter);

        expect(result).toBe('[CONVERTED: <p>This is a paragraph.</p>]');
    });

    it('should preserve LINK placeholders', () => {
        const html = '<p>See {{LINK:0}} for details.</p>';
        const result = convertHtmlToMarkdown(html, converter);

        expect(result).toBe('[CONVERTED: <p>See {{LINK:0}} for details.</p>]');
        expect(result).toContain('{{LINK:0}}');
    });

    it('should preserve ASSET placeholders', () => {
        const html = '<p>Image: {{ASSET:0}}</p>';
        const result = convertHtmlToMarkdown(html, converter);

        expect(result).toBe('[CONVERTED: <p>Image: {{ASSET:0}}</p>]');
        expect(result).toContain('{{ASSET:0}}');
    });

    it('should preserve multiple placeholders', () => {
        const html = '<p>Link {{LINK:0}} and {{LINK:1}} with asset {{ASSET:0}}.</p>';
        const result = convertHtmlToMarkdown(html, converter);

        expect(result).toContain('{{LINK:0}}');
        expect(result).toContain('{{LINK:1}}');
        expect(result).toContain('{{ASSET:0}}');
    });

    it('should handle empty HTML', () => {
        expect(convertHtmlToMarkdown('', converter)).toBe('');
        expect(convertHtmlToMarkdown(null, converter)).toBe('');
        expect(convertHtmlToMarkdown(undefined, converter)).toBe('');
    });

    it('should preserve placeholders in complex HTML', () => {
        const html = `
            <h2>Quest Log</h2>
            <p>Talk to {{LINK:0}} in the tavern.</p>
            <ul>
                <li>Find the artifact</li>
                <li>Refer to {{ASSET:0}} for map</li>
            </ul>
            <p>Reward: See {{LINK:1}}.</p>
        `;
        const result = convertHtmlToMarkdown(html, converter);

        expect(result).toContain('{{LINK:0}}');
        expect(result).toContain('{{LINK:1}}');
        expect(result).toContain('{{ASSET:0}}');
    });
});
