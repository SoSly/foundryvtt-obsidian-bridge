import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { extractCalloutsToPlaceholders, restoreCalloutPlaceholders } from './toMarkdown';

// Set up DOM globals for DOMParser
let dom;
beforeAll(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
});

afterAll(() => {
    delete global.DOMParser;
});

// Mock showdown converter that strips HTML tags
const mockShowdown = {
    makeMarkdown: html => html.replace(/<[^>]+>/g, '').trim()
};

describe('extractCalloutsToPlaceholders', () => {
    describe('non-foldable callout extraction', () => {
        it('should extract a non-foldable callout correctly', () => {
            const html = '<div class="obsidian-callout" data-callout-type="note" data-callout-custom-title="true"><div class="callout-title">My Title</div><div class="callout-content"><p>Body content here.</p></div></div>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].customTitle).toBe(true);
            expect(result.callouts[0].foldable).toBe(false);
            expect(result.callouts[0].defaultOpen).toBe(true);
            expect(result.callouts[0].title).toBe('My Title');
            expect(result.callouts[0].body).toBe('Body content here.');
            expect(result.content).toBe('<p>{{CALLOUT:0}}</p>');
        });
    });

    describe('foldable callout extraction', () => {
        it('should extract foldable open callout (has open attr)', () => {
            const html = '<details class="obsidian-callout" data-callout-type="tip" data-callout-custom-title="true" open><summary class="callout-title">Expand Me</summary><div class="callout-content"><p>Expanded content.</p></div></details>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('tip');
            expect(result.callouts[0].foldable).toBe(true);
            expect(result.callouts[0].defaultOpen).toBe(true);
            expect(result.callouts[0].title).toBe('Expand Me');
            expect(result.callouts[0].body).toBe('Expanded content.');
        });

        it('should extract foldable closed callout (no open attr)', () => {
            const html = '<details class="obsidian-callout" data-callout-type="warning" data-callout-custom-title="false"><summary class="callout-title">Warning</summary><div class="callout-content"><p>Collapsed content.</p></div></details>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts).toHaveLength(1);
            expect(result.callouts[0].type).toBe('warning');
            expect(result.callouts[0].foldable).toBe(true);
            expect(result.callouts[0].defaultOpen).toBe(false);
            expect(result.callouts[0].customTitle).toBe(false);
        });
    });

    describe('custom title handling', () => {
        it('should preserve custom title when customTitle is true', () => {
            const html = '<div class="obsidian-callout" data-callout-type="note" data-callout-custom-title="true"><div class="callout-title">Custom Title</div><div class="callout-content"><p>Content.</p></div></div>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts[0].customTitle).toBe(true);
            expect(result.callouts[0].title).toBe('Custom Title');
        });

        it('should mark auto-generated title when customTitle is false', () => {
            const html = '<div class="obsidian-callout" data-callout-type="warning" data-callout-custom-title="false"><div class="callout-title">Warning</div><div class="callout-content"><p>Content.</p></div></div>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts[0].customTitle).toBe(false);
            expect(result.callouts[0].title).toBe('Warning');
        });
    });

    describe('missing data attributes use defaults', () => {
        it('should default type to "note" if missing', () => {
            const html = '<div class="obsidian-callout"><div class="callout-title">Title</div><div class="callout-content"><p>Body.</p></div></div>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts[0].type).toBe('note');
        });

        it('should default customTitle to true if missing', () => {
            const html = '<div class="obsidian-callout" data-callout-type="info"><div class="callout-title">Some Title</div><div class="callout-content"><p>Body.</p></div></div>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts[0].customTitle).toBe(true);
        });
    });

    describe('multi-line content handling', () => {
        it('should convert multi-line HTML content to markdown', () => {
            const html = '<div class="obsidian-callout" data-callout-type="note" data-callout-custom-title="true"><div class="callout-title">Title</div><div class="callout-content"><p>Line one.</p><p>Line two.</p></div></div>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts[0].body).toContain('Line one.');
            expect(result.callouts[0].body).toContain('Line two.');
        });
    });

    describe('multiple callouts in document', () => {
        it('should extract multiple callouts with correct indices', () => {
            const html = '<p>Before.</p><div class="obsidian-callout" data-callout-type="note" data-callout-custom-title="true"><div class="callout-title">First</div><div class="callout-content"><p>First body.</p></div></div><p>Middle.</p><div class="obsidian-callout" data-callout-type="warning" data-callout-custom-title="false"><div class="callout-title">Second</div><div class="callout-content"><p>Second body.</p></div></div><p>After.</p>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts).toHaveLength(2);
            expect(result.callouts[0].type).toBe('note');
            expect(result.callouts[0].title).toBe('First');
            expect(result.callouts[1].type).toBe('warning');
            expect(result.callouts[1].title).toBe('Second');
            expect(result.content).toContain('{{CALLOUT:0}}');
            expect(result.content).toContain('{{CALLOUT:1}}');
        });

        it('should extract adjacent callouts without merging their content', () => {
            // This reproduces a real-world bug where consecutive callouts were merged
            const html = `<div class="obsidian-callout" data-callout-type="read-aloud" data-callout-custom-title="true">
                <div class="callout-title"><p>When the party reaches Halfhap, read:</p></div>
                <div class="callout-content"><p>As you return to Halfhap under leaden skies.</p></div>
            </div>
            <div class="obsidian-callout" data-callout-type="read-aloud" data-callout-custom-title="true">
                <div class="callout-title"><p>If the party chooses to oblige, read:</p></div>
                <div class="callout-content"><p>You are guided into the keep once more.</p></div>
            </div>`;

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.callouts).toHaveLength(2);
            expect(result.callouts[0].title).toBe('When the party reaches Halfhap, read:');
            expect(result.callouts[0].body).toBe('As you return to Halfhap under leaden skies.');
            expect(result.callouts[1].title).toBe('If the party chooses to oblige, read:');
            expect(result.callouts[1].body).toBe('You are guided into the keep once more.');
            // Ensure second callout content is NOT in first callout's body
            expect(result.callouts[0].body).not.toContain('oblige');
            expect(result.callouts[0].body).not.toContain('guided');
        });

        it('should wrap placeholders in paragraph elements for block-level treatment', () => {
            // Adjacent callouts need to be block-level elements for proper markdown conversion
            const html = `<div class="obsidian-callout" data-callout-type="note" data-callout-custom-title="true">
                <div class="callout-title">First</div>
                <div class="callout-content"><p>Body 1</p></div>
            </div><div class="obsidian-callout" data-callout-type="warning" data-callout-custom-title="true">
                <div class="callout-title">Second</div>
                <div class="callout-content"><p>Body 2</p></div>
            </div>`;

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            // Placeholders should be in separate paragraph elements
            expect(result.content).toContain('<p>{{CALLOUT:0}}</p>');
            expect(result.content).toContain('<p>{{CALLOUT:1}}</p>');
        });
    });

    describe('content preservation around callouts', () => {
        it('should preserve content before, between, and after callouts', () => {
            const html = '<p>Before content.</p><div class="obsidian-callout" data-callout-type="note" data-callout-custom-title="true"><div class="callout-title">Title</div><div class="callout-content"><p>Body.</p></div></div><p>After content.</p>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.content).toContain('<p>Before content.</p>');
            expect(result.content).toContain('{{CALLOUT:0}}');
            expect(result.content).toContain('<p>After content.</p>');
        });
    });

    describe('edge cases', () => {
        it('should return empty string and empty array for empty content', () => {
            const result = extractCalloutsToPlaceholders('', mockShowdown);

            expect(result.content).toBe('');
            expect(result.callouts).toEqual([]);
        });

        it('should return empty string and empty array for null content', () => {
            const result = extractCalloutsToPlaceholders(null, mockShowdown);

            expect(result.content).toBe('');
            expect(result.callouts).toEqual([]);
        });

        it('should return empty string and empty array for undefined content', () => {
            const result = extractCalloutsToPlaceholders(undefined, mockShowdown);

            expect(result.content).toBe('');
            expect(result.callouts).toEqual([]);
        });

        it('should return content unchanged when no callouts present', () => {
            const html = '<p>Just regular HTML content.</p>';

            const result = extractCalloutsToPlaceholders(html, mockShowdown);

            expect(result.content).toBe('<p>Just regular HTML content.</p>');
            expect(result.callouts).toEqual([]);
        });
    });
});

describe('restoreCalloutPlaceholders', () => {
    describe('non-foldable callout restoration', () => {
        it('should restore non-foldable callout with custom title', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'note',
                title: 'My Title',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Body content here.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!note] My Title\n> Body content here.');
        });

        it('should restore non-foldable callout without title when customTitle is false', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'warning',
                title: 'Warning',
                customTitle: false,
                foldable: false,
                defaultOpen: true,
                body: 'Warning body.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!warning]\n> Warning body.');
        });
    });

    describe('foldable callout restoration', () => {
        it('should restore foldable open callout with + modifier', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'tip',
                title: 'Expand Me',
                customTitle: true,
                foldable: true,
                defaultOpen: true,
                body: 'Expanded content.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!tip]+ Expand Me\n> Expanded content.');
        });

        it('should restore foldable closed callout with - modifier', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'danger',
                title: 'Danger Zone',
                customTitle: true,
                foldable: true,
                defaultOpen: false,
                body: 'Collapsed content.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!danger]- Danger Zone\n> Collapsed content.');
        });
    });

    describe('multi-line body handling', () => {
        it('should prefix each body line with "> "', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'note',
                title: 'Title',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Line one.\nLine two.\nLine three.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!note] Title\n> Line one.\n> Line two.\n> Line three.');
        });

        it('should prefix blank lines with "> "', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'note',
                title: 'Title',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Paragraph one.\n\nParagraph two.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!note] Title\n> Paragraph one.\n> \n> Paragraph two.');
        });
    });

    describe('multiple callout restoration', () => {
        it('should restore multiple callouts in correct positions', () => {
            const content = 'Before.\n\n{{CALLOUT:0}}\n\nMiddle.\n\n{{CALLOUT:1}}\n\nAfter.';
            const callouts = [
                {
                    type: 'note',
                    title: 'First',
                    customTitle: true,
                    foldable: false,
                    defaultOpen: true,
                    body: 'First body.'
                },
                {
                    type: 'warning',
                    title: 'Second',
                    customTitle: true,
                    foldable: false,
                    defaultOpen: true,
                    body: 'Second body.'
                }
            ];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toContain('Before.');
            expect(result).toContain('> [!note] First\n> First body.');
            expect(result).toContain('Middle.');
            expect(result).toContain('> [!warning] Second\n> Second body.');
            expect(result).toContain('After.');
        });
    });

    describe('empty body handling', () => {
        it('should handle callout with empty body', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'note',
                title: 'Title',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: ''
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!note] Title');
        });
    });

    describe('code blocks in body', () => {
        it('should prefix fenced code block lines with "> "', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'tip',
                title: 'Code Example',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Here is code:\n```javascript\nconst x = 1;\n```'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!tip] Code Example\n> Here is code:\n> ```javascript\n> const x = 1;\n> ```');
        });

        it('should prefix inline code correctly', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'note',
                title: 'Title',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Use `console.log()` for debugging.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!note] Title\n> Use `console.log()` for debugging.');
        });
    });

    describe('nested blockquotes in body', () => {
        it('should prefix nested blockquote lines correctly', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'quote',
                title: 'Citation',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Main quote.\n> Nested quote.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!quote] Citation\n> Main quote.\n> > Nested quote.');
        });

        it('should handle multiple nesting levels', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [{
                type: 'note',
                title: 'Title',
                customTitle: true,
                foldable: false,
                defaultOpen: true,
                body: 'Normal.\n> One level.\n>> Two levels.'
            }];

            const result = restoreCalloutPlaceholders(content, callouts);

            expect(result).toBe('> [!note] Title\n> Normal.\n> > One level.\n> >> Two levels.');
        });
    });

    describe('edge cases', () => {
        it('should return empty string for empty content', () => {
            const result = restoreCalloutPlaceholders('', []);

            expect(result).toBe('');
        });

        it('should return empty string for null content', () => {
            const result = restoreCalloutPlaceholders(null, []);

            expect(result).toBe('');
        });

        it('should return empty string for undefined content', () => {
            const result = restoreCalloutPlaceholders(undefined, []);

            expect(result).toBe('');
        });

        it('should return content unchanged when no callouts array', () => {
            const content = 'Just regular content.';

            const result = restoreCalloutPlaceholders(content, []);

            expect(result).toBe('Just regular content.');
        });
    });
});
