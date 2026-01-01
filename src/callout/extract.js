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
 * Creates a Callout from collected header info and body lines.
 */
function createCallout(header, bodyLines) {
    return new Callout({
        type: header.type,
        title: header.titleText,
        customTitle: header.titleText.length > 0,
        foldable: header.foldModifier !== null,
        defaultOpen: header.foldModifier !== '-',
        body: bodyLines.join('\n')
    });
}

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

    let currentHeader = null;
    let bodyLines = [];

    function finalizeCallout() {
        callouts.push(createCallout(currentHeader, bodyLines));
        outputLines.push(`{{CALLOUT:${callouts.length - 1}}}`);
        currentHeader = null;
        bodyLines = [];
    }

    for (const line of lines) {
        const headerMatch = line.match(CALLOUT_HEADER_PATTERN);

        if (headerMatch) {
            if (currentHeader) {
                finalizeCallout();
            }

            currentHeader = {
                type: headerMatch[1].toLowerCase(),
                foldModifier: headerMatch[2] || null,
                titleText: headerMatch[3] ? headerMatch[3].trim() : ''
            };
            continue;
        }

        if (!currentHeader) {
            outputLines.push(line);
            continue;
        }

        const blockquoteMatch = line.match(BLOCKQUOTE_LINE_PATTERN);

        if (blockquoteMatch) {
            let lineContent = blockquoteMatch[1];
            if (lineContent.startsWith(' ')) {
                lineContent = lineContent.slice(1);
            }
            bodyLines.push(lineContent);
            continue;
        }

        finalizeCallout();
        outputLines.push(line);
    }

    if (currentHeader) {
        finalizeCallout();
    }

    return {
        content: outputLines.join('\n'),
        callouts
    };
}
