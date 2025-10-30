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
        let content = markdownFile.content;

        content = resolveLinks(content, markdownFile.links, linkMap, markdownFile.filePath);
        content = resolveAssets(content, markdownFile.assets, assetFiles);

        markdownFile.content = content;
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

/**
 * Selects the best matching file for a link target using context-aware resolution.
 *
 * Resolution priority (matching Obsidian's behavior):
 * 1. Files in the same folder as the source file
 * 2. Files in parent folders (walking up the tree)
 * 3. Files anywhere in the vault (shortest path wins as tiebreaker)
 *
 * Examples:
 *   Source: "Campaign/NPCs/Villain.md"
 *   Link: "[[Waterdeep]]"
 *
 *   Candidates:
 *     "Campaign/NPCs/Waterdeep.md"        - Priority 1 (same folder)
 *     "Campaign/Locations/Waterdeep.md"   - Priority 2 (parent folder)
 *     "Other/Places/Waterdeep.md"         - Priority 3 (fallback)
 *
 * @param {Array<MarkdownFile>} candidates - All files matching the link target
 * @param {string} sourceFilePath - Full path of the file containing the link
 * @returns {MarkdownFile|null} Best matching file, or null if no candidates
 */
function selectBestMatch(candidates, sourceFilePath) {
    if (candidates.length === 0) {
        return null;
    }
    if (candidates.length === 1) {
        return candidates[0];
    }

    const sourceFolderPath = extractFolderPath(sourceFilePath);

    const sameFolder = candidates.filter(c =>
        extractFolderPath(c.filePath) === sourceFolderPath
    );
    if (sameFolder.length > 0) {
        return pickShortestPath(sameFolder);
    }

    const parentFolders = getParentFolders(sourceFolderPath);
    for (const parentFolder of parentFolders) {
        const inParent = candidates.filter(c =>
            extractFolderPath(c.filePath) === parentFolder
        );
        if (inParent.length > 0) {
            return pickShortestPath(inParent);
        }
    }

    return pickShortestPath(candidates);
}

/**
 * Extracts the folder path from a full file path.
 *
 * @param {string} filePath - Full file path (e.g., "folder/subfolder/file.md")
 * @returns {string} Folder path (e.g., "folder/subfolder")
 */
function extractFolderPath(filePath) {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash === -1 ? '' : filePath.substring(0, lastSlash);
}

/**
 * Gets all parent folders from most specific to root.
 *
 * @param {string} folderPath - Folder path (e.g., "Campaign/NPCs")
 * @returns {Array<string>} Parent folders (e.g., ["Campaign", ""])
 */
function getParentFolders(folderPath) {
    if (!folderPath) {
        return [];
    }

    const parts = folderPath.split('/');
    const parents = [];

    for (let i = parts.length - 1; i > 0; i--) {
        parents.push(parts.slice(0, i).join('/'));
    }

    parents.push('');

    return parents;
}

/**
 * Picks the file with the shortest path from a list of candidates.
 *
 * @param {Array<MarkdownFile>} candidates - Files to compare
 * @returns {MarkdownFile} File with shortest path
 */
function pickShortestPath(candidates) {
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

function resolveLinks(content, links, linkMap, sourceFilePath) {
    if (!Array.isArray(links) || links.length === 0) {
        return content;
    }

    for (const link of links) {
        const lowercaseTarget = link.obsidianTarget.toLowerCase();
        const candidates = linkMap.get(lowercaseTarget) || [];
        const targetFile = selectBestMatch(candidates, sourceFilePath);

        if (targetFile) {
            const displayText = link.displayText || link.obsidianTarget;
            const resolvedLink = `@UUID[${targetFile.foundryPageUuid}]{${displayText}}`;
            content = content.replaceAll(link.placeholder, resolvedLink);
        } else {
            console.warn(`Unresolved link: ${link.obsidianTarget}`);
            content = content.replaceAll(link.placeholder, link.originalText);
        }
    }

    return content;
}

function resolveAssets(content, assets, assetFiles) {
    if (!Array.isArray(assets) || assets.length === 0) {
        return content;
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
            content = content.replaceAll(asset.placeholder, replacement);
        } else {
            console.warn(`Unresolved asset: ${asset.obsidianPath}`);
            content = content.replaceAll(asset.placeholder, asset.originalText);
        }
    }

    return content;
}
