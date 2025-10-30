/**
 * Collects unique asset paths from markdown files.
 * Aggregates all asset references and removes duplicates.
 *
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files containing asset references
 * @returns {Set<string>} Set of unique asset paths
 */
export function collectUniqueAssetPaths(markdownFiles) {
    const uniquePaths = new Set();

    for (const markdownFile of markdownFiles) {
        for (const asset of markdownFile.assets) {
            uniquePaths.add(asset.obsidianPath);
        }
    }

    return uniquePaths;
}
