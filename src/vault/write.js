/**
 * Writes markdown files and assets to user's chosen destination.
 * Supports two modes: direct filesystem access (modern browsers) or ZIP download (fallback).
 *
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files to export
 * @param {NonMarkdownFile[]} nonMarkdownFiles - Array of asset files to export
 * @param {ExportOptions} exportOptions - Export configuration
 * @returns {Promise<{filesWritten: number, assetsWritten: number, errors: string[]}>}
 */
export default async function writeVault(markdownFiles, nonMarkdownFiles, exportOptions) {
    if (exportOptions.directoryHandle) {
        return await writeToFilesystem(markdownFiles, nonMarkdownFiles, exportOptions.directoryHandle);
    }

    return await writeToZip(markdownFiles, nonMarkdownFiles);
}

/**
 * Writes files to a ZIP archive and triggers browser download.
 *
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files
 * @param {NonMarkdownFile[]} nonMarkdownFiles - Array of asset files
 * @returns {Promise<{filesWritten: number, assetsWritten: number, errors: string[]}>}
 */
async function writeToZip(markdownFiles, nonMarkdownFiles) {
    const JSZip = globalThis.JSZip;
    if (!JSZip) {
        throw new Error('JSZip library not available');
    }

    const zip = new JSZip();
    const errors = [];
    let filesWritten = 0;
    let assetsWritten = 0;

    for (const mdFile of markdownFiles) {
        try {
            zip.file(mdFile.filePath, mdFile.content);
            filesWritten++;
        } catch (error) {
            errors.push(`Failed to add ${mdFile.filePath} to ZIP: ${error.message}`);
        }
    }

    for (const assetFile of nonMarkdownFiles) {
        try {
            const decodedPath = decodeURIComponent(assetFile.foundryDataPath);
            const response = await fetch(decodedPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            zip.file(assetFile.filePath, blob);
            assetsWritten++;
        } catch (error) {
            errors.push(`Failed to add ${assetFile.filePath} to ZIP: ${error.message}`);
        }
    }

    try {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, 'obsidian-export.zip');
    } catch (error) {
        errors.push(`Failed to generate ZIP: ${error.message}`);
    }

    return { filesWritten, assetsWritten, errors };
}

/**
 * Writes files directly to the filesystem using File System Access API.
 *
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files
 * @param {NonMarkdownFile[]} nonMarkdownFiles - Array of asset files
 * @param {FileSystemDirectoryHandle} dirHandle - Pre-selected directory handle
 * @returns {Promise<{filesWritten: number, assetsWritten: number, errors: string[]}>}
 */
async function writeToFilesystem(markdownFiles, nonMarkdownFiles, dirHandle) {
    const errors = [];
    let filesWritten = 0;
    let assetsWritten = 0;

    const permissionStatus = await dirHandle.requestPermission({ mode: 'readwrite' });
    if (permissionStatus !== 'granted') {
        errors.push('Write permission not granted for selected directory');
        return { filesWritten, assetsWritten, errors };
    }

    for (const mdFile of markdownFiles) {
        try {
            await writeMarkdownFile(dirHandle, mdFile);
            filesWritten++;
        } catch (error) {
            errors.push(`Failed to write ${mdFile.filePath}: ${error.message}`);
        }
    }

    for (const assetFile of nonMarkdownFiles) {
        try {
            await writeAssetFile(dirHandle, assetFile);
            assetsWritten++;
        } catch (error) {
            errors.push(`Failed to write ${assetFile.filePath}: ${error.message}`);
        }
    }

    return { filesWritten, assetsWritten, errors };
}

/**
 * Writes a markdown file to the filesystem, creating directories as needed.
 *
 * @param {FileSystemDirectoryHandle} dirHandle - Root directory handle
 * @param {MarkdownFile} markdownFile - Markdown file to write
 * @returns {Promise<void>}
 */
async function writeMarkdownFile(dirHandle, markdownFile) {
    if (!markdownFile.content && markdownFile.content !== '') {
        throw new Error('MarkdownFile missing content');
    }

    const pathParts = markdownFile.filePath.split('/');
    const fileName = pathParts.pop();

    let currentDir = dirHandle;
    for (const part of pathParts) {
        if (!part) {
            continue;
        }
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }

    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(markdownFile.content);
    await writable.close();
}

/**
 * Writes an asset file to the filesystem by streaming from Foundry data path.
 *
 * @param {FileSystemDirectoryHandle} dirHandle - Root directory handle
 * @param {NonMarkdownFile} assetFile - Asset file to write
 * @returns {Promise<void>}
 */
async function writeAssetFile(dirHandle, assetFile) {
    const decodedPath = decodeURIComponent(assetFile.foundryDataPath);
    const response = await fetch(decodedPath);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const pathParts = assetFile.filePath.split('/');
    const fileName = pathParts.pop();

    let currentDir = dirHandle;
    for (const part of pathParts) {
        if (!part) {
            continue;
        }
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }

    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
}

/**
 * Triggers a browser download of a blob.
 *
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
