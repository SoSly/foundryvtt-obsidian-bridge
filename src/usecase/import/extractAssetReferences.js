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

export default function extractAssetReferences(markdownText) {
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
                || obsidianPath.startsWith('https://')) {
                continue;
            }

            assets.push({
                obsidianPath,
                originalText,
                isImage,
                altText
            });
        }
    }

    return assets;
}
