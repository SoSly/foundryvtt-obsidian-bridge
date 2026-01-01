import Callout from '../domain/Callout';

/**
 * Matches an Obsidian callout header line.
 *
 * Examples:
 *   > [!note]                     - Basic callout
 *   > [!warning] Title            - Callout with title
 *   > [!tip]+                     - Foldable, open by default
 *   > [!danger]- Collapsed Title  - Foldable, closed by default, with title
 *
 * Capture groups:
 *   1: type (required) - word characters, hyphens, underscores
 *   2: fold modifier (optional) - + or - immediately after ]
 *   3: title text (optional) - everything after modifier/type
 *
 * The fold modifier MUST immediately follow the closing bracket.
 * If there's a space before +/-, it's part of the title.
 */
const CALLOUT_HEADER_PATTERN = /^>\s*\[!([\w-]+)\]([+-])?(?:\s+(.*))?$/;

/**
 * Matches a line that continues a blockquote (starts with >).
 * Used to collect callout body lines.
 */
const BLOCKQUOTE_LINE_PATTERN = /^>(.*)/;

/**
 * Extracts Obsidian callout blocks from markdown content.
 * Replaces callouts with placeholders in the format {{CALLOUT:N}}.
 *
 * @param {string} content - The markdown content to process
 * @returns {{ content: string, callouts: Callout[] }} - Processed content and extracted callouts
 */
export function extractCallouts(content) {
    if (!content) {
        return { content: '', callouts: [] };
    }

    const lines = content.split('\n');
    const callouts = [];
    const outputLines = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const headerMatch = line.match(CALLOUT_HEADER_PATTERN);

        if (headerMatch) {
            const type = headerMatch[1].toLowerCase();
            const foldModifier = headerMatch[2] || null;
            const titleText = headerMatch[3] ? headerMatch[3].trim() : '';

            const foldable = foldModifier !== null;
            const defaultOpen = foldModifier !== '-';
            const customTitle = titleText.length > 0;

            const bodyLines = [];
            i++;

            while (i < lines.length) {
                const bodyLine = lines[i];
                const bodyMatch = bodyLine.match(BLOCKQUOTE_LINE_PATTERN);

                if (!bodyMatch) {
                    break;
                }

                const nextHeaderMatch = bodyLine.match(CALLOUT_HEADER_PATTERN);
                if (nextHeaderMatch) {
                    break;
                }

                let lineContent = bodyMatch[1];
                if (lineContent.startsWith(' ')) {
                    lineContent = lineContent.slice(1);
                }

                bodyLines.push(lineContent);
                i++;
            }

            const body = bodyLines.join('\n');

            const callout = new Callout({
                type,
                title: titleText,
                customTitle,
                foldable,
                defaultOpen,
                body
            });

            callouts.push(callout);
            outputLines.push(`{{CALLOUT:${callouts.length - 1}}}`);
        } else {
            outputLines.push(line);
            i++;
        }
    }

    return {
        content: outputLines.join('\n'),
        callouts
    };
}
