/**
 * Converts single line breaks to <br /> tags for line break preservation.
 * Only converts line breaks between content lines (not paragraph breaks).
 * Skips content inside fenced code blocks.
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
        const shouldAddBr = !inCodeBlock && hasContent && nextHasContent;

        if (shouldAddBr) {
            result.push(`${line}<br />`);
        } else {
            result.push(line);
        }
    }

    return result.join('\n');
}
