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
