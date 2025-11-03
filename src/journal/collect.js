/**
 * Collects all directories needed for a set of file paths.
 * Generates parent directories and sorts them by depth for creation order.
 *
 * @param {string[]} assetPaths - Array of file paths
 * @param {string} baseDataPath - Base directory path to prepend
 * @returns {string[]} Array of directory paths sorted by depth (shallow to deep)
 */
export function collectRequiredDirectories(assetPaths, baseDataPath) {
    const allDirectories = new Set();

    for (const assetPath of assetPaths) {
        const pathParts = assetPath.split('/');
        pathParts.pop();

        if (pathParts.length === 0) {
            allDirectories.add(baseDataPath);
            continue;
        }

        let currentPath = baseDataPath;
        allDirectories.add(currentPath);

        for (const part of pathParts) {
            currentPath = `${currentPath}/${part}`;
            allDirectories.add(currentPath);
        }
    }

    const sortedDirectories = Array.from(allDirectories).sort((a, b) => {
        const aDepth = a.split('/').length;
        const bDepth = b.split('/').length;
        return aDepth - bDepth;
    });

    return sortedDirectories;
}
