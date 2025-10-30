export default function resolvePlaceholders(markdownFiles, nonMarkdownFiles) {
    if (!Array.isArray(markdownFiles) || markdownFiles.length === 0) {
        return markdownFiles || [];
    }
    if (!Array.isArray(nonMarkdownFiles)) {
        nonMarkdownFiles = [];
    }

    const linkMap = buildLinkMap(markdownFiles);
    const assetFiles = buildAssetFiles(nonMarkdownFiles);

    for (const markdownFile of markdownFiles) {
        let htmlContent = markdownFile.htmlContent;

        htmlContent = resolveLinks(htmlContent, markdownFile.links, linkMap);
        htmlContent = resolveAssets(htmlContent, markdownFile.assets, assetFiles);

        markdownFile.htmlContent = htmlContent;
    }

    return markdownFiles;
}

function buildLinkMap(markdownFiles) {
    const linkMap = new Map();

    for (const markdownFile of markdownFiles) {
        if (!markdownFile.foundryPageUuid) {
            continue;
        }
        for (const lookupKey of markdownFile.lookupKeys) {
            const lowercaseKey = lookupKey.toLowerCase();
            if (!linkMap.has(lowercaseKey)) {
                linkMap.set(lowercaseKey, []);
            }
            linkMap.get(lowercaseKey).push(markdownFile);
        }
    }

    return linkMap;
}

function buildAssetFiles(nonMarkdownFiles) {
    return nonMarkdownFiles.filter(f => f.foundryDataPath);
}

function selectBestMatch(candidates) {
    if (candidates.length === 0) {
        return null;
    }
    if (candidates.length === 1) {
        return candidates[0];
    }

    return candidates.reduce((best, current) => {
        return current.filePath.length < best.filePath.length ? current : best;
    });
}

function findBestAssetMatch(obsidianPath, nonMarkdownFiles) {
    const matches = nonMarkdownFiles.filter(f =>
        f.filePath.endsWith(obsidianPath) || f.filePath === obsidianPath
    );

    if (matches.length === 0) {
        return null;
    }
    if (matches.length === 1) {
        return matches[0].foundryDataPath;
    }

    const best = matches.reduce((best, current) => {
        return current.filePath.length < best.filePath.length ? current : best;
    });

    return best.foundryDataPath;
}

function resolveLinks(htmlContent, links, linkMap) {
    if (!Array.isArray(links) || links.length === 0) {
        return htmlContent;
    }

    for (const link of links) {
        const lowercaseTarget = link.obsidianTarget.toLowerCase();
        const candidates = linkMap.get(lowercaseTarget) || [];
        const targetFile = selectBestMatch(candidates);

        if (targetFile) {
            const displayText = link.displayText || link.obsidianTarget;
            const resolvedLink = `@UUID[${targetFile.foundryPageUuid}]{${displayText}}`;
            htmlContent = htmlContent.replaceAll(link.placeholder, resolvedLink);
        } else {
            console.warn(`Unresolved link: ${link.obsidianTarget}`);
            htmlContent = htmlContent.replaceAll(link.placeholder, link.originalText);
        }
    }

    return htmlContent;
}

function resolveAssets(htmlContent, assets, assetFiles) {
    if (!Array.isArray(assets) || assets.length === 0) {
        return htmlContent;
    }

    for (const asset of assets) {
        const foundryPath = findBestAssetMatch(asset.obsidianPath, assetFiles);

        if (foundryPath) {
            let replacement;
            if (asset.isImage) {
                const alt = asset.altText || '';
                replacement = `<img src="${foundryPath}" alt="${alt}" />`;
            } else {
                const text = asset.altText || asset.obsidianPath;
                replacement = `<a href="${foundryPath}">${text}</a>`;
            }
            htmlContent = htmlContent.replaceAll(asset.placeholder, replacement);
        } else {
            console.warn(`Unresolved asset: ${asset.obsidianPath}`);
            htmlContent = htmlContent.replaceAll(asset.placeholder, asset.originalText);
        }
    }

    return htmlContent;
}
