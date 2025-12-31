/**
 * Converts HTML content to markdown while preserving placeholders.
 *
 * @param {string} htmlContent - HTML content containing placeholders
 * @param {import('showdown').Converter} showdownConverter - Configured Showdown instance
 * @returns {string} Markdown content with preserved placeholders
 */
export default function convertHtmlToMarkdown(htmlContent, showdownConverter) {
    if (!htmlContent) {
        return '';
    }

    return showdownConverter.makeMarkdown(htmlContent);
}

/**
 * Removes empty HTML comments from markdown content.
 * Showdown inserts these after lists to prevent merging during round-trips.
 *
 * @param {string} markdown - Markdown content potentially containing empty comments
 * @returns {string} Markdown with empty HTML comments removed
 */
export function stripEmptyHtmlComments(markdown) {
    if (!markdown) {
        return '';
    }

    return markdown.replace(/<!--\s*-->\n?/g, '');
}

/**
 * Converts <br> tags back to newlines during export.
 * Handles all variants: <br>, <br/>, <br />, with optional trailing newline.
 *
 * @param {string} markdown - Markdown content potentially containing br tags
 * @returns {string} Markdown with br tags converted to newlines
 */
export function convertBrToNewline(markdown) {
    if (!markdown) {
        return '';
    }

    return markdown.replace(/<br\s*\/?>\r?\n?/gi, '\n');
}
