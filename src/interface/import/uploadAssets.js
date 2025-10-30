import NonMarkdownFile from '../../domain/NonMarkdownFile';
import { resolveAssetFile } from '../../usecase/import/resolveAssetFile';
import { collectUniqueAssetPaths } from '../../usecase/import/collectUniqueAssetPaths';
import { collectRequiredDirectories } from '../../usecase/import/collectRequiredDirectories';

/**
 * Uploads non-markdown assets referenced in imported markdown files.
 * Only uploads assets from MarkdownFiles that were actually imported (have foundryPageUuid).
 *
 * @param {MarkdownFile[]} markdownFiles - All markdown files (will filter to imported only)
 * @param {FileList} vaultFiles - Original FileList from vault selection
 * @param {ImportOptions} importOptions - Import configuration (dataPath)
 * @returns {Promise<{nonMarkdownFiles: NonMarkdownFile[], uploadedPaths: string[]}>}
 * @throws {Error} If any upload fails
 */
export async function uploadAssets(markdownFiles, vaultFiles, importOptions) {
    const importedFiles = markdownFiles.filter(mf => mf.foundryPageUuid);
    const uniqueAssetPaths = collectUniqueAssetPaths(importedFiles);

    if (uniqueAssetPaths.size === 0) {
        return { nonMarkdownFiles: [], uploadedPaths: [] };
    }

    const resolvedAssets = [];
    for (const assetPath of uniqueAssetPaths) {
        const vaultFile = resolveAssetFile(assetPath, vaultFiles);

        if (!vaultFile) {
            console.warn(`Asset referenced but not found in vault: ${assetPath}`);
            continue;
        }

        const parts = vaultFile.webkitRelativePath.split('/');
        const vaultRelativePath = parts.slice(1).join('/');

        resolvedAssets.push({ vaultFile, vaultRelativePath });
    }

    const vaultPaths = resolvedAssets.map(asset => asset.vaultRelativePath);
    const directories = collectRequiredDirectories(vaultPaths, importOptions.dataPath);
    await ensureDirectoriesExist(directories);

    const uploadResults = await Promise.all(
        resolvedAssets.map(async ({ vaultFile, vaultRelativePath }) => {
            const pathParts = vaultRelativePath.split('/');
            pathParts.pop();
            const directory = pathParts.length > 0
                ? `${importOptions.dataPath}/${pathParts.join('/')}`
                : importOptions.dataPath;

            const response = await FilePicker.upload('data', directory, vaultFile, {}, { notify: false });

            if (!response || !response.path) {
                throw new Error(`Failed to upload asset: ${vaultRelativePath}`);
            }

            const nonMarkdownFile = new NonMarkdownFile({ filePath: vaultRelativePath });
            nonMarkdownFile.foundryDataPath = response.path;

            return { nonMarkdownFile, uploadedPath: response.path };
        })
    );

    const nonMarkdownFiles = uploadResults.map(r => r.nonMarkdownFile);
    const uploadedPaths = uploadResults.map(r => r.uploadedPath);

    return { nonMarkdownFiles, uploadedPaths };
}

/**
 * Deletes uploaded asset files from Foundry's data directory.
 *
 * @param {string[]} uploadedPaths - Array of file paths to delete
 */
export async function rollbackAssetUploads(uploadedPaths) {
    for (const path of uploadedPaths.reverse()) {
        try {
            await FilePicker.delete('data', path, { notify: false });
        } catch (error) {
            console.error(`Failed to rollback asset ${path}:`, error);
        }
    }
}


async function ensureDirectoriesExist(directories) {
    for (const directory of directories) {
        try {
            await FilePicker.browse('data', directory);
        } catch (error) {
            try {
                await FilePicker.createDirectory('data', directory);
            } catch (createError) {
                console.warn(`Failed to create directory ${directory}:`, createError);
            }
        }
    }
}


