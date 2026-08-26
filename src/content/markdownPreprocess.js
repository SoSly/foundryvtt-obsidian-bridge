/**
 * Matches a callout placeholder line exactly.
 * These are injected by extractCallouts and should not get <br /> tags.
 */
const CALLOUT_PLACEHOLDER_PATTERN = /^\{\{CALLOUT:\d+\}\}$/;
const TABLE_SEPARATOR_PATTERN = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

function findTableLines(lines) {
    const tableLines = new Set();

    for (let i = 0; i < lines.length - 1; i++) {
        if (!lines[i].includes('|') || !TABLE_SEPARATOR_PATTERN.test(lines[i + 1])) {
            continue;
        }

        tableLines.add(i);
        tableLines.add(i + 1);
        for (let row = i + 2; row < lines.length && lines[row].includes('|'); row++) {
            tableLines.add(row);
        }
    }

    return tableLines;
}

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
    const tableLines = findTableLines(lines);
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
            && !isCalloutPlaceholder
            && !tableLines.has(i);

        if (shouldAddBr) {
            result.push(`${line}<br />`);
        } else {
            result.push(line);
        }
    }

    return result.join('\n');
}
