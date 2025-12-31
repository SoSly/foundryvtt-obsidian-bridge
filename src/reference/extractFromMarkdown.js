import Reference from '../domain/Reference.js';

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

/**
 * Matches standard markdown image syntax.
 *
 * Examples:
 *   ![alt text](path/to/image.png)      - Image with alt text
 *   ![](path/to/file.pdf)                - Image with no alt text
 *
 * Capture groups:
 *   1: alt text (optional, empty string if omitted)
 *   2: file path (required)
 *
 * Does not match: Links without ! prefix, Obsidian [[]] syntax
 */
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;

/**
 * Matches standard markdown link syntax, excluding images.
 *
 * Examples:
 *   [link text](path/to/file.pdf)       - Link to asset
 *   [download](../assets/doc.docx)      - Link with path
 *
 * Capture groups:
 *   1: link text (required)
 *   2: file path (required)
 *
 * Negative lookbehind (?<!!): Prevents matching ![...](...) image syntax.
 * Does not match: Images with ! prefix, Obsidian [[]] syntax
 */
const MARKDOWN_LINK_PATTERN = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Matches Obsidian wiki-link syntax for files with extensions (assets only).
 *
 * Examples:
 *   [[image.png]]                       - Basic embed
 *   ![[document.pdf]]                   - Explicit embed with !
 *   [[folder/file.jpg]]                 - Embed with path
 *
 * Capture groups:
 *   1: full file path with extension (required)
 *
 * Must have file extension to distinguish from page links.
 * Does not match: Page links without extensions, heading references
 */
const OBSIDIAN_EMBED_PATTERN = /!?\[\[([^\]#|]+\.[^\]#|]+)\]\]/g;

/**
 * Matches standard markdown link syntax with foundry:// protocol.
 *
 * Examples:
 *   [Bob](foundry://Actor.abc123)                           - Actor link
 *   [Magic Sword](foundry://Item.xyz789)                    - Item link
 *   [Goblin](foundry://Compendium.dnd5e.monsters.Actor.xyz) - Compendium link
 *
 * Capture groups:
 *   1: link text/label (required)
 *   2: Foundry UUID (required)
 *
 * Does not match: Links with other protocols, Obsidian [[]] syntax
 */
const FOUNDRY_LINK_PATTERN = /\[([^\]]+)\]\(foundry:\/\/([^)]+)\)/g;

export function extractLinkReferences(markdownText) {
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

    let foundryMatch;
    while ((foundryMatch = FOUNDRY_LINK_PATTERN.exec(markdownText)) !== null) {
        const label = foundryMatch[1].trim();
        const uuid = foundryMatch[2].trim();
        const source = foundryMatch[0];

        links.push(new Reference({
            source,
            obsidian: '',
            foundry: uuid,
            label,
            type: 'document',
            isImage: false,
            metadata: {
                isFoundryProtocol: true
            }
        }));
    }

    return links;
}

export function extractAssetReferences(markdownText) {
    if (!markdownText) {
        return [];
    }

    const assets = [];
    const patterns = [
        MARKDOWN_IMAGE_PATTERN,
        MARKDOWN_LINK_PATTERN,
        OBSIDIAN_EMBED_PATTERN
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(markdownText)) !== null) {
            let obsidianPath;
            let altText = '';
            let isImage = false;
            const originalText = match[0];

            if (pattern === OBSIDIAN_EMBED_PATTERN) {
                obsidianPath = match[1].trim();
                isImage = originalText.startsWith('!');
            } else if (pattern === MARKDOWN_IMAGE_PATTERN) {
                altText = match[1].trim();
                obsidianPath = match[2].trim();
                isImage = true;
            } else {
                altText = match[1].trim();
                obsidianPath = match[2].trim();
                isImage = false;
            }

            if (obsidianPath.endsWith('.md')
                || obsidianPath.startsWith('http://')
                || obsidianPath.startsWith('https://')
                || obsidianPath.startsWith('foundry://')) {
                continue;
            }

            assets.push(new Reference({
                source: originalText,
                obsidian: obsidianPath,
                label: altText || null,
                type: 'asset',
                isImage,
                metadata: {}
            }));
        }
    }

    return assets;
}
