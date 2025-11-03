import Reference from '../domain/Reference.js';

/**
 * Matches Foundry UUID link syntax.
 *
 * Examples:
 *   @UUID[Actor.abc123]{Bob the NPC}                                - Actor link
 *   @UUID[JournalEntry.xyz789]{Quest Log}                           - Journal entry link
 *   @UUID[JournalEntry.abc.JournalEntryPage.def]{Page}             - Journal page link
 *   @UUID[Compendium.dnd5e.monsters.Actor.xyz]{Monster}            - Compendium link
 *
 * Capture groups:
 *   1: UUID (required)
 *   2: Display label (required)
 *
 * Reference: https://foundryvtt.com/article/uuids/
 */
const UUID_PATTERN = /@UUID\[([^\]]+)\]\{([^}]+)\}/g;

/**
 * Matches HTML img tags.
 *
 * Examples:
 *   <img src="path/to/image.png" alt="Description">
 *   <img src="image.jpg">
 *
 * Used to extract entire img tag for further parsing of src and alt attributes.
 */
const IMG_TAG_PATTERN = /<img[^>]*>/gi;

/**
 * Matches src attribute within an img tag.
 *
 * Examples:
 *   src="path/to/file.png"
 *   src='path/to/file.jpg'
 *
 * Capture groups:
 *   1: File path (required)
 */
const IMG_SRC_PATTERN = /src=["']([^"']+)["']/i;

/**
 * Matches alt attribute within an img tag.
 *
 * Examples:
 *   alt="Description text"
 *   alt=""
 *
 * Capture groups:
 *   1: Alt text (optional, may be empty string)
 */
const IMG_ALT_PATTERN = /alt=["']([^"']*)["']/i;

/**
 * Matches HTML anchor tags with href attributes pointing to files.
 *
 * Examples:
 *   <a href="path/to/file.pdf">Download</a>
 *   <a href="docs/handout.docx">View Document</a>
 *
 * Capture groups:
 *   1: File path (required)
 *   2: Link text (required)
 *
 * Does not match: Anchors without href, anchors with empty content
 */
const ANCHOR_TAG_PATTERN = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;

/**
 * Extracts Foundry UUID references from HTML content.
 *
 * @param {string} htmlContent - HTML content containing @UUID[...]{...} patterns
 * @param {object} [options={}] - Extraction options (currently unused)
 * @returns {Reference[]} Array of Reference objects with foundry UUIDs
 */
export function extractLinkReferences(htmlContent, options = {}) {
    if (!htmlContent) {
        return [];
    }

    const links = [];
    let match;

    while ((match = UUID_PATTERN.exec(htmlContent)) !== null) {
        const uuid = match[1].trim();
        const label = match[2].trim();
        const source = match[0];

        const isJournalReference = uuid.startsWith('JournalEntry.')
                                   || uuid.includes('.JournalEntry.');

        links.push(new Reference({
            source,
            foundry: uuid,
            obsidian: '',
            label,
            type: 'document',
            isImage: false,
            metadata: {
                isJournalReference
            }
        }));
    }

    return links;
}

/**
 * Extracts asset references (images and file links) from HTML content.
 *
 * @param {string} htmlContent - HTML content containing img tags and anchor tags
 * @param {object} [options={}] - Extraction options
 * @param {string} [options.assetPathPrefix=''] - Path prefix to strip from asset URLs
 * @returns {Reference[]} Array of Reference objects for assets, deduplicated by path
 */
export function extractAssetReferences(htmlContent, options = {}) {
    if (!htmlContent) {
        return [];
    }

    const assets = [];
    const assetPathPrefix = options.assetPathPrefix || '';
    const seenPaths = new Set();

    let match;
    const imgPattern = new RegExp(IMG_TAG_PATTERN.source, IMG_TAG_PATTERN.flags);
    while ((match = imgPattern.exec(htmlContent)) !== null) {
        const imgTag = match[0];
        const srcMatch = imgTag.match(IMG_SRC_PATTERN);
        const altMatch = imgTag.match(IMG_ALT_PATTERN);

        if (!srcMatch) {
            continue;
        }

        const fullPath = srcMatch[1].trim();
        const altText = altMatch ? altMatch[1].trim() : '';

        if (shouldSkipAsset(fullPath)) {
            continue;
        }

        const strippedPath = stripPrefix(fullPath, assetPathPrefix);

        if (seenPaths.has(strippedPath)) {
            continue;
        }

        seenPaths.add(strippedPath);

        assets.push(new Reference({
            source: imgTag,
            foundry: strippedPath,
            obsidian: '',
            label: altText || null,
            type: 'asset',
            isImage: true,
            metadata: {}
        }));
    }

    const anchorPattern = new RegExp(ANCHOR_TAG_PATTERN.source, ANCHOR_TAG_PATTERN.flags);
    while ((match = anchorPattern.exec(htmlContent)) !== null) {
        const fullPath = match[1].trim();
        const linkText = match[2].trim();

        if (shouldSkipAsset(fullPath)) {
            continue;
        }

        const strippedPath = stripPrefix(fullPath, assetPathPrefix);

        if (seenPaths.has(strippedPath)) {
            continue;
        }

        seenPaths.add(strippedPath);

        assets.push(new Reference({
            source: match[0],
            foundry: strippedPath,
            obsidian: '',
            label: linkText || null,
            type: 'asset',
            isImage: false,
            metadata: {}
        }));
    }

    return assets;
}

function shouldSkipAsset(path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return true;
    }

    if (path.startsWith('data:')) {
        return true;
    }

    return false;
}

function stripPrefix(path, prefix) {
    if (!prefix) {
        return path;
    }

    const normalizedPath = path.replace(/\\/g, '/');
    const normalizedPrefix = prefix.replace(/\\/g, '/');

    if (normalizedPath.startsWith(normalizedPrefix)) {
        const stripped = normalizedPath.slice(normalizedPrefix.length);
        return stripped.startsWith('/') ? stripped.slice(1) : stripped;
    }

    return path;
}
