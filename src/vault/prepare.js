import MarkdownFile from '../domain/MarkdownFile.js';
import generateLookupKeys from '../reference/keys.js';

/**
 * Transforms browser File objects into MarkdownFile objects.
 *
 * @param {File[]} files - Array of browser File objects with webkitRelativePath
 * @returns {Promise<MarkdownFile[]>} Array of MarkdownFile objects with markdown content
 */
export default async function prepareFilesForImport(files) {
    if (!files || files.length === 0) {
        return [];
    }

    const markdownFiles = [];

    for (const file of files) {
        const markdownText = await file.text();
        const lookupKeys = generateLookupKeys(file.webkitRelativePath);

        const markdownFile = new MarkdownFile({
            filePath: file.webkitRelativePath,
            lookupKeys,
            content: markdownText,
            links: [],
            assets: [],
            foundryPageUuid: null
        });

        markdownFiles.push(markdownFile);
    }

    return markdownFiles;
}
