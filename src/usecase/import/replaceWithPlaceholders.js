export default function replaceWithPlaceholders(markdownText, links, assets) {
    if (!markdownText) {
        return { text: markdownText || '', links: [], assets: [] };
    }

    let text = markdownText;
    const replacements = [];

    links.forEach((link, index) => {
        replacements.push({
            original: link.originalText,
            placeholder: `{{LINK:${index}}}`,
            type: 'link',
            index
        });
    });

    assets.forEach((asset, index) => {
        replacements.push({
            original: asset.originalText,
            placeholder: `{{ASSET:${index}}}`,
            type: 'asset',
            index
        });
    });

    replacements.sort((a, b) => b.original.length - a.original.length);

    for (const replacement of replacements) {
        text = text.replaceAll(replacement.original, replacement.placeholder);
    }

    const updatedLinks = links.map((link, index) => ({
        ...link,
        placeholder: `{{LINK:${index}}}`
    }));

    const updatedAssets = assets.map((asset, index) => ({
        ...asset,
        placeholder: `{{ASSET:${index}}}`
    }));

    return {
        text,
        links: updatedLinks,
        assets: updatedAssets
    };
}
