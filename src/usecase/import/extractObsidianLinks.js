import Reference from '../../domain/Reference.js';

/**
 * Matches Obsidian wiki-link syntax with optional embeds, headings, and display text.
 *
 * Examples:
 *   [[Page Name]]           - Basic link
 *   [[Page#Heading]]        - Link with heading
 *   [[Page|Display Text]]   - Link with custom display
 *   ![[Image.png]]          - Embedded content
 *   [[Page#Heading|Text]]   - Link with heading and custom display
 *
 * Capture groups:
 *   1: ! (embed marker, optional)
 *   2: target page name (required)
 *   3: full heading match including # (optional)
 *   4: heading text after # (optional)
 *   5: full display text match including | (optional)
 *   6: display text after | (optional)
 *
 * Does not match: External URLs, standard markdown links []()
 *
 * Reference: https://help.obsidian.md/Linking+notes+and+files/Internal+links
 */
const OBSIDIAN_LINK_PATTERN = /(!?)\[\[([^\]#|]+)(#([^\]|]+))?(\|([^\]]+))?\]\]/g;

/**
 * Matches file extensions for determining asset vs page links.
 *
 * Examples:
 *   image.png  - matches ".png"
 *   file.md    - matches ".md"
 *   document   - no match
 */
const FILE_EXTENSION_PATTERN = /\.[^.]+$/;

export default function extractObsidianLinks(markdownText) {
    if (!markdownText) {
        return [];
    }

    const links = [];
    let match;

    while ((match = OBSIDIAN_LINK_PATTERN.exec(markdownText)) !== null) {
        const isEmbed = match[1] === '!';
        let obsidianTarget = match[2].trim();
        const heading = match[4] ? match[4].trim() : null;
        const displayText = match[6] ? match[6].trim() : null;
        const originalText = match[0];

        const hasExtension = FILE_EXTENSION_PATTERN.test(obsidianTarget);
        const hasNonMdExtension = hasExtension && !obsidianTarget.endsWith('.md');

        if (isEmbed && hasNonMdExtension) {
            continue;
        }

        if (obsidianTarget.endsWith('.md')) {
            obsidianTarget = obsidianTarget.slice(0, -3);
        }

        links.push(new Reference({
            source: originalText,
            obsidian: obsidianTarget,
            label: displayText,
            type: 'document',
            isImage: false,
            metadata: {
                heading,
                isEmbed
            }
        }));
    }

    return links;
}
