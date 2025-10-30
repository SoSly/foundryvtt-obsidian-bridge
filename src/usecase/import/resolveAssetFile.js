/**
 * Resolves an asset path to a file from the vault FileList.
 * Tries exact match first, then searches for files ending with the path.
 *
 * @param {string} assetPath - The asset path from markdown (e.g., "dragon.png" or "Images/dragon.png")
 * @param {FileList|Array} vaultFiles - The original vault FileList
 * @returns {File|null} The matched file or null if not found
 */
export function resolveAssetFile(assetPath, vaultFiles) {
    const normalizedAssetPath = assetPath.replace(/\\/g, '/');
    const matches = [];

    for (let i = 0; i < vaultFiles.length; i++) {
        const file = vaultFiles[i] || vaultFiles.item(i);
        if (!file || !file.webkitRelativePath) {
            continue;
        }

        const parts = file.webkitRelativePath.split('/');
        const relativePath = parts.slice(1).join('/');

        if (relativePath === normalizedAssetPath) {
            return file;
        }

        if (relativePath.endsWith(`/${normalizedAssetPath}`) || relativePath.endsWith(normalizedAssetPath)) {
            matches.push(file);
        }
    }

    if (matches.length === 0) {
        return null;
    }

    if (matches.length > 1) {
        console.warn(`Ambiguous asset reference "${assetPath}" matches multiple files. Using first match.`);
    }

    return matches[0];
}
