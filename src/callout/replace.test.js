import { replaceCalloutPlaceholders } from './replace';
import Callout from '../domain/Callout';

describe('replaceCalloutPlaceholders', () => {
    const mockShowdown = { makeHtml: md => `<p>${md}</p>` };

    describe('non-foldable callouts', () => {
        it('should render non-foldable callout with auto title (customTitle=false)', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'warning', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Be careful here.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="obsidian-callout"');
            expect(result).toContain('data-callout-type="warning"');
            expect(result).toContain('data-callout-custom-title="false"');
            expect(result).toContain('<div class="callout-title">Warning</div>');
            expect(result).toContain('<div class="callout-content"><p>Be careful here.</p></div>');
            expect(result).not.toContain('<details');
            expect(result).not.toContain('<summary');
        });

        it('should render non-foldable callout with custom title (customTitle=true)', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'note', title: 'My Custom Title', customTitle: true, foldable: false, defaultOpen: true, body: 'Some content.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('data-callout-custom-title="true"');
            expect(result).toContain('<div class="callout-title">My Custom Title</div>');
        });
    });

    describe('foldable callouts', () => {
        it('should render foldable callout with defaultOpen=true (has open attribute)', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'tip', title: 'Expand Me', customTitle: true, foldable: true, defaultOpen: true, body: 'Expanded content.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<details class="obsidian-callout"');
            expect(result).toContain('data-callout-type="tip"');
            expect(result).toContain('data-callout-custom-title="true"');
            expect(result).toContain(' open>');
            expect(result).toContain('<summary class="callout-title">Expand Me</summary>');
            expect(result).toContain('<div class="callout-content"><p>Expanded content.</p></div>');
        });

        it('should render foldable callout with defaultOpen=false (no open attribute)', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'warning', title: '', customTitle: false, foldable: true, defaultOpen: false, body: 'Collapsed content.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<details class="obsidian-callout"');
            expect(result).not.toContain(' open>');
            expect(result).toContain('data-callout-custom-title="false"');
            expect(result).toContain('<summary class="callout-title">Warning</summary>');
        });
    });

    describe('data attributes', () => {
        it('should set all data attributes correctly', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'danger', title: 'Critical', customTitle: true, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('data-callout-type="danger"');
            expect(result).toContain('data-callout-custom-title="true"');
        });

        it('should include data attributes on foldable callouts', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'info', title: '', customTitle: false, foldable: true, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<details class="obsidian-callout" data-callout-type="info" data-callout-custom-title="false" open>');
        });
    });

    describe('body conversion', () => {
        it('should convert body markdown to HTML using showdownConverter', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'note', title: '', customTitle: false, foldable: false, defaultOpen: true, body: '**bold** text' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-content"><p>**bold** text</p></div>');
        });

        it('should handle empty body (header only callout)', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'note', title: 'Header Only', customTitle: true, foldable: false, defaultOpen: true, body: '' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-content"></div>');
        });
    });

    describe('title normalization', () => {
        it('should convert type to title case when customTitle=false', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'warning', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-title">Warning</div>');
        });

        it('should convert hyphenated type to title case with spaces', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'my-custom-type', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-title">My Custom Type</div>');
        });

        it('should convert underscored type to title case with spaces', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'my_custom_type', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-title">My Custom Type</div>');
        });

        it('should use verbatim title when customTitle=true', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'note', title: 'keep-this-exact', customTitle: true, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-title">keep-this-exact</div>');
        });

        it('should handle mixed hyphens and underscores in type', () => {
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'my-custom_type', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<div class="callout-title">My Custom Type</div>');
        });
    });

    describe('multiple callouts', () => {
        it('should replace multiple callouts in order', () => {
            const content = '{{CALLOUT:0}}\n\nSome text.\n\n{{CALLOUT:1}}';
            const callouts = [
                new Callout({ type: 'note', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'First callout.' }),
                new Callout({ type: 'warning', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Second callout.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('data-callout-type="note"');
            expect(result).toContain('<p>First callout.</p>');
            expect(result).toContain('data-callout-type="warning"');
            expect(result).toContain('<p>Second callout.</p>');
            expect(result).toContain('Some text.');
            expect(result.indexOf('note')).toBeLessThan(result.indexOf('warning'));
        });
    });

    describe('content preservation', () => {
        it('should preserve content around placeholders', () => {
            const content = '<p>Before callout.</p>\n{{CALLOUT:0}}\n<p>After callout.</p>';
            const callouts = [
                new Callout({ type: 'tip', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Tip content.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toContain('<p>Before callout.</p>');
            expect(result).toContain('<p>After callout.</p>');
            expect(result).toContain('data-callout-type="tip"');
        });

        it('should handle content with no callout placeholders', () => {
            const content = '<p>Just some HTML content.</p>';
            const callouts = [];

            const result = replaceCalloutPlaceholders(content, callouts, mockShowdown);

            expect(result).toBe('<p>Just some HTML content.</p>');
        });
    });

    describe('edge cases', () => {
        it('should handle empty content', () => {
            const result = replaceCalloutPlaceholders('', [], mockShowdown);

            expect(result).toBe('');
        });

        it('should handle null content', () => {
            const result = replaceCalloutPlaceholders(null, [], mockShowdown);

            expect(result).toBe('');
        });

        it('should handle undefined content', () => {
            const result = replaceCalloutPlaceholders(undefined, [], mockShowdown);

            expect(result).toBe('');
        });
    });

    describe('markdown in title', () => {
        it('should convert bold markdown in custom title', () => {
            const showdown = { makeHtml: md => `<p>${md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>` };
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'note', title: '**Important** Title', customTitle: true, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, showdown);

            expect(result).toContain('<div class="callout-title"><strong>Important</strong> Title</div>');
        });

        it('should convert italic markdown in custom title', () => {
            const showdown = { makeHtml: md => `<p>${md.replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>` };
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'warning', title: '*Emphasized* Warning', customTitle: true, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, showdown);

            expect(result).toContain('<div class="callout-title"><em>Emphasized</em> Warning</div>');
        });

        it('should convert inline code in custom title', () => {
            const showdown = { makeHtml: md => `<p>${md.replace(/`(.+?)`/g, '<code>$1</code>')}</p>` };
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'tip', title: 'Use `console.log()`', customTitle: true, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, showdown);

            expect(result).toContain('<div class="callout-title">Use <code>console.log()</code></div>');
        });

        it('should not apply markdown conversion to auto-generated titles', () => {
            const showdown = { makeHtml: md => `<p>${md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>` };
            const content = '{{CALLOUT:0}}';
            const callouts = [
                new Callout({ type: 'warning', title: '', customTitle: false, foldable: false, defaultOpen: true, body: 'Body.' })
            ];

            const result = replaceCalloutPlaceholders(content, callouts, showdown);

            expect(result).toContain('<div class="callout-title">Warning</div>');
        });
    });
});
