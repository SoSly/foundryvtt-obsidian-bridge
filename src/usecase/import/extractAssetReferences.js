const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;
const MARKDOWN_LINK_PATTERN = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
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
