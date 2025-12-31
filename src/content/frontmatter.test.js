import { describe, it, expect } from '@jest/globals';
import {
    extractFrontmatter,
    prependFrontmatter,
    mergeFrontmatter,
    parseYamlLite,
    serializeYamlLite
} from './frontmatter.js';
import MarkdownFile from '../domain/MarkdownFile.js';

describe('extractFrontmatter', () => {
    describe('happy paths', () => {
        it('should extract simple frontmatter', () => {
            const content = '---\ntitle: Hello\n---\n\nBody content here.';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBe('title: Hello');
            expect(result.content).toBe('\nBody content here.');
        });

        it('should extract frontmatter with special characters', () => {
            const content = '---\nfirst_class: true\ntitle: "quoted value"\ntags: [one, two]\n---\n\nBody';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBe('first_class: true\ntitle: "quoted value"\ntags: [one, two]');
            expect(result.content).toBe('\nBody');
        });

        it('should extract frontmatter with multi-line values', () => {
            const content = '---\ndescription: |\n  This is a\n  multi-line value\ntitle: Test\n---\n\nBody';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBe('description: |\n  This is a\n  multi-line value\ntitle: Test');
            expect(result.content).toBe('\nBody');
        });

        it('should not match empty frontmatter (blank line between delimiters)', () => {
            const content = '---\n\n---\n\nBody content';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe(content);
        });

        it('should handle CRLF line endings', () => {
            const content = '---\r\ntitle: Hello\r\n---\r\n\r\nBody content';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBe('title: Hello');
            expect(result.content).toBe('\r\nBody content');
        });
    });

    describe('negative cases', () => {
        it('should return null frontmatter when no closing delimiter', () => {
            const content = '---\ntitle: Hello\n\nBody content without closing delimiter';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe(content);
        });

        it('should return null frontmatter for truly empty delimiters (no content between)', () => {
            const content = '---\n---\n\nBody content';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe(content);
        });

        it('should return null frontmatter when whitespace before first delimiter', () => {
            const content = ' ---\ntitle: Hello\n---\n\nBody';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe(content);
        });

        it('should return null frontmatter for content without frontmatter', () => {
            const content = 'Just regular content here.';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe(content);
        });

        it('should return null frontmatter when file starts with --- but has no newline after', () => {
            const content = '---title: Hello\n---\n\nBody';
            const result = extractFrontmatter(content);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe(content);
        });

        it('should handle empty content', () => {
            const result = extractFrontmatter('');

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe('');
        });

        it('should handle null content', () => {
            const result = extractFrontmatter(null);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe('');
        });

        it('should handle undefined content', () => {
            const result = extractFrontmatter(undefined);

            expect(result.frontmatter).toBeNull();
            expect(result.content).toBe('');
        });
    });
});

describe('prependFrontmatter', () => {
    it('should prepend frontmatter with delimiters when frontmatter exists', () => {
        const markdownFile = new MarkdownFile({
            filePath: 'test.md',
            content: 'Body content',
            frontmatter: 'title: Hello'
        });

        prependFrontmatter(markdownFile);

        expect(markdownFile.content).toBe('---\ntitle: Hello\n---\nBody content');
    });

    it('should not modify content when frontmatter is null', () => {
        const markdownFile = new MarkdownFile({
            filePath: 'test.md',
            content: 'Body content',
            frontmatter: null
        });

        prependFrontmatter(markdownFile);

        expect(markdownFile.content).toBe('Body content');
    });

    it('should prepend empty frontmatter with delimiters when frontmatter is empty string', () => {
        const markdownFile = new MarkdownFile({
            filePath: 'test.md',
            content: 'Body content',
            frontmatter: ''
        });

        prependFrontmatter(markdownFile);

        expect(markdownFile.content).toBe('---\n\n---\nBody content');
    });

    it('should handle multi-line frontmatter', () => {
        const markdownFile = new MarkdownFile({
            filePath: 'test.md',
            content: 'Body content',
            frontmatter: 'title: Hello\nauthor: Jane'
        });

        prependFrontmatter(markdownFile);

        expect(markdownFile.content).toBe('---\ntitle: Hello\nauthor: Jane\n---\nBody content');
    });
});

describe('mergeFrontmatter', () => {
    it('should return null with no warnings when array is empty', () => {
        const result = mergeFrontmatter([]);

        expect(result.merged).toBeNull();
        expect(result.warnings).toEqual([]);
    });

    it('should return null with no warnings when all elements are null', () => {
        const result = mergeFrontmatter([null, null, null]);

        expect(result.merged).toBeNull();
        expect(result.warnings).toEqual([]);
    });

    it('should return single frontmatter unchanged when only one exists', () => {
        const result = mergeFrontmatter([null, 'title: Hello', null]);

        expect(result.merged).toBe('title: Hello');
        expect(result.warnings).toEqual([]);
    });

    it('should merge multiple frontmatters with no conflicts', () => {
        const result = mergeFrontmatter([
            'title: Hello',
            'author: Jane'
        ]);

        expect(result.merged).toContain('title: Hello');
        expect(result.merged).toContain('author: Jane');
        expect(result.warnings).toEqual([]);
    });

    it('should use first value on conflict and generate warning', () => {
        const result = mergeFrontmatter([
            'title: First',
            'title: Second'
        ]);

        expect(result.merged).toContain('title: First');
        expect(result.merged).not.toContain('title: Second');
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('title');
    });

    it('should handle unparseable frontmatter by falling back to first', () => {
        const result = mergeFrontmatter([
            'title: Hello',
            'invalid: [unclosed bracket'
        ]);

        expect(result.merged).toBe('title: Hello');
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('parse');
    });

    it('should handle when first frontmatter is unparseable', () => {
        const result = mergeFrontmatter([
            'invalid: [unclosed',
            'title: Hello'
        ]);

        expect(result.merged).toBe('invalid: [unclosed');
        expect(result.warnings).toHaveLength(1);
    });

    it('should merge arrays from different frontmatters', () => {
        const result = mergeFrontmatter([
            'tags:\n  - one\n  - two',
            'categories:\n  - a\n  - b'
        ]);

        expect(result.merged).toContain('tags:');
        expect(result.merged).toContain('categories:');
        expect(result.warnings).toEqual([]);
    });
});

describe('parseYamlLite', () => {
    describe('scalars', () => {
        it('should parse simple key-value pairs', () => {
            const result = parseYamlLite('title: Hello World');

            expect(result).toEqual({ title: 'Hello World' });
        });

        it('should parse multiple key-value pairs', () => {
            const result = parseYamlLite('title: Hello\nauthor: Jane');

            expect(result).toEqual({ title: 'Hello', author: 'Jane' });
        });

        it('should parse quoted values', () => {
            const result = parseYamlLite('title: "Hello: World"');

            expect(result).toEqual({ title: 'Hello: World' });
        });

        it('should parse single-quoted values', () => {
            const result = parseYamlLite("title: 'Hello World'");

            expect(result).toEqual({ title: 'Hello World' });
        });

        it('should parse numeric values', () => {
            const result = parseYamlLite('count: 42\nrating: 4.5');

            expect(result).toEqual({ count: 42, rating: 4.5 });
        });

        it('should parse boolean values', () => {
            const result = parseYamlLite('published: true\ndraft: false');

            expect(result).toEqual({ published: true, draft: false });
        });

        it('should handle empty value as empty string', () => {
            const result = parseYamlLite('title:');

            expect(result).toEqual({ title: '' });
        });
    });

    describe('arrays', () => {
        it('should parse simple array on one line', () => {
            const result = parseYamlLite('tags: [one, two, three]');

            expect(result).toEqual({ tags: ['one', 'two', 'three'] });
        });

        it('should parse multi-line array', () => {
            const result = parseYamlLite('tags:\n  - one\n  - two\n  - three');

            expect(result).toEqual({ tags: ['one', 'two', 'three'] });
        });

        it('should parse array with quoted items', () => {
            const result = parseYamlLite('tags: ["hello world", \'another\']');

            expect(result).toEqual({ tags: ['hello world', 'another'] });
        });
    });

    describe('nested objects', () => {
        it('should parse one level of nesting', () => {
            const result = parseYamlLite('meta:\n  author: Jane\n  date: 2024');

            expect(result).toEqual({
                meta: {
                    author: 'Jane',
                    date: 2024
                }
            });
        });
    });

    describe('invalid YAML', () => {
        it('should return null for unclosed bracket', () => {
            const result = parseYamlLite('tags: [one, two');

            expect(result).toBeNull();
        });

        it('should return null for malformed key', () => {
            const result = parseYamlLite('no colon here');

            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = parseYamlLite('');

            expect(result).toBeNull();
        });

        it('should return null for null input', () => {
            const result = parseYamlLite(null);

            expect(result).toBeNull();
        });
    });
});

describe('serializeYamlLite', () => {
    describe('scalars', () => {
        it('should serialize simple object', () => {
            const result = serializeYamlLite({ title: 'Hello' });

            expect(result).toBe('title: Hello');
        });

        it('should serialize multiple properties', () => {
            const result = serializeYamlLite({ title: 'Hello', author: 'Jane' });

            expect(result).toContain('title: Hello');
            expect(result).toContain('author: Jane');
        });

        it('should serialize numeric values', () => {
            const result = serializeYamlLite({ count: 42 });

            expect(result).toBe('count: 42');
        });

        it('should serialize boolean values', () => {
            const result = serializeYamlLite({ published: true, draft: false });

            expect(result).toContain('published: true');
            expect(result).toContain('draft: false');
        });

        it('should quote values containing colons', () => {
            const result = serializeYamlLite({ title: 'Hello: World' });

            expect(result).toBe('title: "Hello: World"');
        });
    });

    describe('arrays', () => {
        it('should serialize simple array', () => {
            const result = serializeYamlLite({ tags: ['one', 'two'] });

            expect(result).toContain('tags:');
            expect(result).toContain('  - one');
            expect(result).toContain('  - two');
        });
    });

    describe('nested objects', () => {
        it('should serialize one level of nesting', () => {
            const result = serializeYamlLite({
                meta: {
                    author: 'Jane',
                    date: 2024
                }
            });

            expect(result).toContain('meta:');
            expect(result).toContain('  author: Jane');
            expect(result).toContain('  date: 2024');
        });
    });

    describe('edge cases', () => {
        it('should return empty string for empty object', () => {
            const result = serializeYamlLite({});

            expect(result).toBe('');
        });

        it('should return empty string for null', () => {
            const result = serializeYamlLite(null);

            expect(result).toBe('');
        });

        it('should return empty string for undefined', () => {
            const result = serializeYamlLite(undefined);

            expect(result).toBe('');
        });
    });
});
