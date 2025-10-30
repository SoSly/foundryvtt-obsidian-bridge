const OBSIDIAN_LINK_PATTERN = /(!?)\[\[([^\]#|]+)(#([^\]|]+))?(\|([^\]]+))?\]\]/g;
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

        links.push({
            obsidianTarget,
            displayText,
            heading,
            isEmbed,
            originalText
        });
    }

    return links;
}
