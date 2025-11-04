import MarkdownFile from '../domain/MarkdownFile.js';
import generateLookupKeys from '../reference/keys.js';

/**
 * Transforms Foundry JournalEntry documents into MarkdownFile objects.
 *
 * @param {object[]} journals - Array of Foundry JournalEntry documents
 * @param {object} options - Transformation options
 * @param {boolean} options.merge - If true, merge all pages into one file per journal
 * @returns {MarkdownFile[]} Array of MarkdownFile objects with HTML content
 */
export default function prepareJournalsForExport(journals, options = {}) {
    if (!journals || journals.length === 0) {
        return [];
    }

    const { merge = false } = options;
    const markdownFiles = [];

    for (const journal of journals) {
        const pages = journal.pages?.contents || [];

        if (merge || pages.length === 1) {
            markdownFiles.push(createMergedFile(journal, pages));
        } else {
            for (const page of pages) {
                markdownFiles.push(createPageFile(journal, page));
            }
        }
    }

    return markdownFiles;
}

function createMergedFile(journal, pages) {
    const combinedContent = pages
        .map(page => page.text?.content || '')
        .join('\n\n');

    const filePath = buildFilePath(journal.folder, journal.name);
    const lookupKeys = generateLookupKeys(filePath);

    return new MarkdownFile({
        filePath,
        lookupKeys,
        content: combinedContent,
        links: [],
        assets: [],
        foundryPageUuid: journal.uuid
    });
}

function createPageFile(journal, page) {
    const htmlContent = page.text?.content || '';
    const filePath = buildFilePath(journal.folder, journal.name, page.name);
    const lookupKeys = generateLookupKeys(filePath);

    return new MarkdownFile({
        filePath,
        lookupKeys,
        content: htmlContent,
        links: [],
        assets: [],
        foundryPageUuid: page.uuid
    });
}

function buildFilePath(folder, journalName, pageName = null) {
    const folderPath = folder?.name || '';
    const isCombinedFolder = folderPath && journalName === folderPath.split('/').pop();

    if (pageName) {
        if (isCombinedFolder) {
            return `${folderPath}/${pageName}.md`;
        }
        if (folderPath) {
            return `${folderPath}/${journalName}/${pageName}.md`;
        }
        return `${journalName}/${pageName}.md`;
    }

    if (folderPath) {
        return `${folderPath}/${journalName}.md`;
    }
    return `${journalName}.md`;
}
