import { extractCallouts } from './extract';
import Callout from '../domain/Callout';

describe('extractCallouts', () => {
    describe('basic callout detection', () => {
        it('should extract a basic callout with content', () => {
            const markdown = `> [!note]
> This is the body content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0]).toBeInstanceOf(Callout);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].body).toBe('This is the body content.');
            expect(result.callouts[0].foldable).toBe(false);
            expect(result.callouts[0].defaultOpen).toBe(true);
            expect(result.callouts[0].customTitle).toBe(false);
            expect(result.content).toBe('{{CALLOUT:0}}');
        });

        it('should extract a callout with custom title', () => {
            const markdown = `> [!warning] Custom Title Here
> Body text goes here.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('warning');
            expect(result.callouts[0].title).toBe('Custom Title Here');
            expect(result.callouts[0].customTitle).toBe(true);
            expect(result.callouts[0].body).toBe('Body text goes here.');
        });

        it('should handle callout with no title text and set customTitle false', () => {
            const markdown = `> [!info]
> Some information.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('info');
            expect(result.callouts[0].title).toBe('');
            expect(result.callouts[0].customTitle).toBe(false);
        });
    });

    describe('foldable states', () => {
        it('should detect + modifier as foldable with defaultOpen=true', () => {
            const markdown = `> [!tip]+
> This is foldable and open by default.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].foldable).toBe(true);
            expect(result.callouts[0].defaultOpen).toBe(true);
        });

        it('should detect - modifier as foldable with defaultOpen=false', () => {
            const markdown = `> [!danger]-
> This is foldable and closed by default.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].foldable).toBe(true);
            expect(result.callouts[0].defaultOpen).toBe(false);
        });

        it('should detect no modifier as non-foldable', () => {
            const markdown = `> [!note]
> Not foldable.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].foldable).toBe(false);
            expect(result.callouts[0].defaultOpen).toBe(true);
        });

        it('should handle foldable callout with title', () => {
            const markdown = `> [!note]+ My Collapsible Note
> Content here.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].foldable).toBe(true);
            expect(result.callouts[0].defaultOpen).toBe(true);
            expect(result.callouts[0].title).toBe('My Collapsible Note');
            expect(result.callouts[0].customTitle).toBe(true);
        });
    });

    describe('space before fold modifier', () => {
        it('should treat space before minus as part of title, not a modifier', () => {
            const markdown = `> [!warning] - Title
> Body content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('warning');
            expect(result.callouts[0].foldable).toBe(false);
            expect(result.callouts[0].title).toBe('- Title');
            expect(result.callouts[0].customTitle).toBe(true);
        });

        it('should treat space before plus as part of title, not a modifier', () => {
            const markdown = `> [!note] + Positive Things
> List here.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].foldable).toBe(false);
            expect(result.callouts[0].title).toBe('+ Positive Things');
            expect(result.callouts[0].customTitle).toBe(true);
        });
    });

    describe('type normalization', () => {
        it('should lowercase custom callout types', () => {
            const markdown = `> [!My-Custom-Type]
> Custom content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('my-custom-type');
        });

        it('should lowercase types with underscores', () => {
            const markdown = `> [!My_Custom_Type]
> Content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('my_custom_type');
        });

        it('should lowercase mixed case types', () => {
            const markdown = `> [!MyCustomType]
> Content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('mycustomtype');
        });

        it('should preserve already lowercase types', () => {
            const markdown = `> [!warning]
> Content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('warning');
        });
    });

    describe('empty callout', () => {
        it('should handle callout with header only (no body lines)', () => {
            const markdown = '> [!note]';
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].body).toBe('');
        });

        it('should handle callout with title but no body', () => {
            const markdown = '> [!warning] Empty Warning';
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].title).toBe('Empty Warning');
            expect(result.callouts[0].body).toBe('');
        });
    });

    describe('malformed syntax', () => {
        it('should NOT convert empty type [!]', () => {
            const markdown = `> [!]
> Some content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(0);
            expect(result.content).toBe(markdown);
        });

        it('should NOT convert missing closing bracket [!type', () => {
            const markdown = `> [!type
> Some content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(0);
            expect(result.content).toBe(markdown);
        });

        it('should NOT convert type with invalid characters', () => {
            const markdown = `> [!type with spaces]
> Content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(0);
            expect(result.content).toBe(markdown);
        });
    });

    describe('adjacent callouts', () => {
        it('should extract adjacent callouts with no blank line between', () => {
            // When a callout header appears in what would be body content,
            // it terminates the current callout and starts a new one.
            // The newline between placeholders comes from the line break
            // between the end of the first callout and the start of the second.
            const markdown = `> [!note]
> First callout content.
> [!warning]
> Second callout content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(2);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].body).toBe('First callout content.');
            expect(result.callouts[1].type).toBe('warning');
            expect(result.callouts[1].body).toBe('Second callout content.');
            expect(result.content).toBe('{{CALLOUT:0}}\n{{CALLOUT:1}}');
        });
    });

    describe('nested blockquote inside callout', () => {
        it('should convert >> to > in body (nested blockquote)', () => {
            const markdown = `> [!quote]
> Main quote content.
>> Nested quote level.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toBe('Main quote content.\n> Nested quote level.');
        });

        it('should handle multiple levels of nesting', () => {
            const markdown = `> [!note]
> Normal line.
>> One level nested.
>>> Two levels nested.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toBe('Normal line.\n> One level nested.\n>> Two levels nested.');
        });
    });

    describe('multi-paragraph callout content', () => {
        it('should handle lines with just > as paragraph breaks', () => {
            const markdown = `> [!note]
> First paragraph.
>
> Second paragraph.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toBe('First paragraph.\n\nSecond paragraph.');
        });

        it('should handle lines with > followed by space as paragraph breaks', () => {
            const markdown = `> [!info]
> Line one.
>
> Line two.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toBe('Line one.\n\nLine two.');
        });
    });

    describe('content preservation', () => {
        it('should preserve content before callout', () => {
            const markdown = `Some text before.

> [!note]
> Callout content.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.content).toBe('Some text before.\n\n{{CALLOUT:0}}');
        });

        it('should preserve content after callout', () => {
            const markdown = `> [!note]
> Callout content.

Some text after.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.content).toBe('{{CALLOUT:0}}\n\nSome text after.');
        });

        it('should preserve content between callouts', () => {
            const markdown = `> [!note]
> First callout.

Some text in between.

> [!warning]
> Second callout.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(2);
            expect(result.content).toBe('{{CALLOUT:0}}\n\nSome text in between.\n\n{{CALLOUT:1}}');
        });
    });

    describe('edge cases', () => {
        it('should return empty callouts array and unchanged content for no callouts', () => {
            const markdown = 'Just regular markdown text.';
            const result = extractCallouts(markdown);

            expect(result.callouts).toEqual([]);
            expect(result.content).toBe(markdown);
        });

        it('should return empty callouts array for empty string', () => {
            const result = extractCallouts('');

            expect(result.callouts).toEqual([]);
            expect(result.content).toBe('');
        });

        it('should return empty callouts array for null', () => {
            const result = extractCallouts(null);

            expect(result.callouts).toEqual([]);
            expect(result.content).toBe('');
        });

        it('should return empty callouts array for undefined', () => {
            const result = extractCallouts(undefined);

            expect(result.callouts).toEqual([]);
            expect(result.content).toBe('');
        });

        it('should handle regular blockquote that is not a callout', () => {
            const markdown = `> Just a regular blockquote.
> With more lines.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toEqual([]);
            expect(result.content).toBe(markdown);
        });

        it('should stop collecting body at non-blockquote line', () => {
            const markdown = `> [!note]
> Callout content.
Regular text not in callout.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toBe('Callout content.');
            expect(result.content).toBe('{{CALLOUT:0}}\nRegular text not in callout.');
        });
    });

    describe('placeholder indexing', () => {
        it('should use correct indices for multiple callouts', () => {
            const markdown = `> [!note]
> First.

> [!warning]
> Second.

> [!tip]
> Third.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(3);
            expect(result.content).toContain('{{CALLOUT:0}}');
            expect(result.content).toContain('{{CALLOUT:1}}');
            expect(result.content).toContain('{{CALLOUT:2}}');
        });
    });

    describe('code blocks inside callouts', () => {
        it('should preserve fenced code block in callout body', () => {
            const markdown = `> [!tip] Code Example
> Here is some code:
> \`\`\`javascript
> const x = 1;
> \`\`\`
> After the code.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toContain('```javascript');
            expect(result.callouts[0].body).toContain('const x = 1;');
            expect(result.callouts[0].body).toContain('```');
            expect(result.callouts[0].body).toContain('After the code.');
        });

        it('should preserve inline code in callout body', () => {
            const markdown = `> [!note]
> Use the \`console.log()\` function.`;
            const result = extractCallouts(markdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].body).toBe('Use the `console.log()` function.');
        });
    });

    describe('all 12 callout types', () => {
        const types = [
            'note', 'abstract', 'summary', 'tldr', 'info', 'todo',
            'tip', 'hint', 'important', 'success', 'check', 'done',
            'question', 'help', 'faq', 'warning', 'caution', 'attention',
            'failure', 'fail', 'missing', 'danger', 'error',
            'bug', 'example', 'quote', 'cite'
        ];

        types.forEach(type => {
            it(`should extract ${type} callout`, () => {
                const markdown = `> [!${type}]
> Content for ${type}.`;
                const result = extractCallouts(markdown);

                expect(result.callouts).toHaveLength(1);
                expect(result.callouts[0].type).toBe(type);
            });
        });
    });
});
