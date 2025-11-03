export default function replaceWithPlaceholders(markdownText, links, assets) {
    if (!markdownText) {
        return { text: markdownText || '', links: [], assets: [] };
    }

    let text = markdownText;
    const replacements = [];

    links.forEach((link, index) => {
        const placeholder = `{{LINK:${index}}}`;
        link.placeholder = placeholder;
        replacements.push({
            original: link.source,
            placeholder,
            type: 'link',
            index
        });
    });

    assets.forEach((asset, index) => {
        const placeholder = `{{ASSET:${index}}}`;
        asset.placeholder = placeholder;
        replacements.push({
            original: asset.source,
            placeholder,
            type: 'asset',
            index
        });
    });

    replacements.sort((a, b) => b.original.length - a.original.length);

    for (const replacement of replacements) {
        text = text.replaceAll(replacement.original, replacement.placeholder);
    }

    return {
        text,
        links,
        assets
    };
}
