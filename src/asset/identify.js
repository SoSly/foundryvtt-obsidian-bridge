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
    const assetPaths = collectUniqueAssetPaths(markdownFiles);
    const nonMarkdownFiles = [];

    for (const assetPath of assetPaths) {
        const foundryPath = await verifyAssetExists(assetPath);
        if (!foundryPath) {
            console.warn(`Asset not found in Foundry data directory: ${assetPath}`);
            continue;
        }

        const nonMarkdownFile = new NonMarkdownFile({ filePath: assetPath });
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
    const uniquePaths = new Set();

    for (const markdownFile of markdownFiles) {
        for (const asset of markdownFile.assets) {
            uniquePaths.add(asset.foundry);
        }
    }

    return uniquePaths;
}

/**
 * Verifies that an asset exists in Foundry's data directory.
 * Uses FilePicker to check if the file can be browsed, which confirms existence.
 *
 * @param {string} assetPath - Vault-relative path to the asset
 * @returns {Promise<string|null>} Full Foundry data path if exists, null if not found
 */
async function verifyAssetExists(assetPath) {
    try {
        const response = await FilePicker.browse('data', assetPath);
        if (!response || !response.target) {
            return null;
        }
        return response.target;
    } catch (error) {
        return null;
    }
}
