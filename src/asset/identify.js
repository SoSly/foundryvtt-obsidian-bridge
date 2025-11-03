import NonMarkdownFile from '../domain/NonMarkdownFile.js';

/**
 * Identifies assets referenced in markdown files that need to be exported.
 * Collects unique asset paths, verifies they exist in Foundry's data directory,
 * and creates NonMarkdownFile objects for valid assets.
 *
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files with asset references
 * @returns {Promise<{nonMarkdownFiles: NonMarkdownFile[]}>} Object containing array of identified assets
 */
export default async function identifyAssets(markdownFiles) {
    const assetMap = collectUniqueAssetPaths(markdownFiles);
    const nonMarkdownFiles = [];

    for (const [foundryPath, vaultPath] of assetMap) {
        const exists = await verifyAssetExists(foundryPath);
        if (!exists) {
            console.warn(`Asset not found in Foundry data directory: ${foundryPath}`);
            continue;
        }

        const nonMarkdownFile = new NonMarkdownFile({ filePath: vaultPath });
        nonMarkdownFile.foundryDataPath = foundryPath;
        nonMarkdownFiles.push(nonMarkdownFile);
    }

    return { nonMarkdownFiles };
}

/**
 * Collects unique asset paths from all markdown files.
 * Asset paths are extracted from the 'foundry' property of Reference objects
 * in each MarkdownFile's assets array.
 *
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files containing asset references
 * @returns {Set<string>} Set of unique asset paths
 */
function collectUniqueAssetPaths(markdownFiles) {
    const uniqueAssets = new Map();

    for (const markdownFile of markdownFiles) {
        for (const asset of markdownFile.assets) {
            if (!uniqueAssets.has(asset.foundry)) {
                uniqueAssets.set(asset.foundry, asset.obsidian);
            }
        }
    }

    return uniqueAssets;
}

/**
 * Verifies that an asset exists in Foundry's data directory.
 * Uses FilePicker to check if the file can be browsed, which confirms existence.
 *
 * @param {string} assetPath - Full Foundry path to the asset
 * @returns {Promise<boolean>} True if asset exists, false otherwise
 */
async function verifyAssetExists(assetPath) {
    try {
        const response = await FilePicker.browse('data', assetPath);
        return !!(response && response.target);
    } catch (error) {
        return false;
    }
}
