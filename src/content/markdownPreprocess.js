/**
 * Matches a callout placeholder line exactly.
 * These are injected by extractCallouts and should not get <br /> tags.
 */
const CALLOUT_PLACEHOLDER_PATTERN = /^\{\{CALLOUT:\d+\}\}$/;

/**
 * Converts single line breaks to <br /> tags for line break preservation.
 * Only converts line breaks between content lines (not paragraph breaks).
 * Skips content inside fenced code blocks and callout placeholder lines.
 *
 * @param {string} content - Markdown content to process
 * @returns {string} Content with single line breaks converted to <br /> tags
 */
export default function convertNewlinesToBr(content) {
    if (!content) {
        return '';
    }

    const lines = content.split(/\r?\n/);
    const result = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();

        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
            inCodeBlock = !inCodeBlock;
        }

        const nextLine = lines[i + 1];
        const hasContent = line.trim().length > 0;
        const nextHasContent = nextLine !== undefined && nextLine.trim().length > 0;

        const isCalloutPlaceholder = CALLOUT_PLACEHOLDER_PATTERN.test(line.trim());

        const shouldAddBr = !inCodeBlock
            && hasContent
            && nextHasContent
            && !isCalloutPlaceholder;

        if (shouldAddBr) {
            result.push(`${line}<br />`);
        } else {
            result.push(line);
        }
    }

    return result.join('\n');
}
