import MarkdownFile from '../../domain/MarkdownFile.js';
import extractAssetReferences from './extractAssetReferences.js';
import extractObsidianLinks from './extractObsidianLinks.js';
import generateLookupKeys from './generateLookupKeys.js';
import replaceWithPlaceholders from './replaceWithPlaceholders.js';

export default async function parseMarkdownFiles(converter, files) {
    if (!converter || !files || files.length === 0) {
        return [];
    }

    const markdownFiles = [];

    for (const file of files) {
        const markdownText = await file.text();
        const links = extractObsidianLinks(markdownText);
        const assets = extractAssetReferences(markdownText);
        const {
            text: textWithPlaceholders,
            links: linksWithPlaceholders,
            assets: assetsWithPlaceholders
        } = replaceWithPlaceholders(markdownText, links, assets);
        const htmlContent = converter.makeHtml(textWithPlaceholders);
        const lookupKeys = generateLookupKeys(file.webkitRelativePath);

        const markdownFile = new MarkdownFile({
            filePath: file.webkitRelativePath,
            lookupKeys,
            htmlContent,
            links: linksWithPlaceholders,
            assets: assetsWithPlaceholders,
            foundryPageUuid: null
        });

        markdownFiles.push(markdownFile);
    }

    return markdownFiles;
}
