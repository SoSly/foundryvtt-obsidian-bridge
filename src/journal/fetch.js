/**
 * Extract journal content from Foundry for export
 *
 * Dependencies: Foundry (JournalEntry API)
 */

import MarkdownFile from '../domain/MarkdownFile.js';
import generateLookupKeys from '../reference/keys.js';

/**
 * Matches any character that is not a word character, whitespace, or hyphen.
 * Used to remove special characters from journal/folder names for file paths.
 *
 * Examples:
 *   "Hello World"   - no match (only word chars and space)
 *   "Test & Debug"  - matches "&"
 *   "Page #1!"      - matches "#" and "!"
 *   "My-File_Name"  - no match (word chars and hyphen)
 *
 * Does not match: Letters, numbers, underscores, spaces, hyphens
 */
const SPECIAL_CHARS_PATTERN = /[^\w\s-]/g;

/**
 * Matches one or more consecutive whitespace characters.
 * Used to replace spaces with hyphens in file paths.
 *
 * Examples:
 *   "Hello World"      - matches single space
 *   "Multiple  Spaces" - matches double space
 *   "Tab\tSeparated"   - matches tab character
 */
const WHITESPACE_PATTERN = /\s+/g;

function buildFolderPath(journal) {
    const parts = [];
    let currentFolder = journal.folder;

    while (currentFolder) {
        parts.unshift(sanitizeName(currentFolder.name));
        currentFolder = currentFolder.folder;
    }

    return parts.join('/');
}

function sanitizeName(name) {
    return name
        .replace(SPECIAL_CHARS_PATTERN, '')
        .replace(WHITESPACE_PATTERN, '-')
        .toLowerCase();
}

/**
 * Extracts journal content from Foundry into MarkdownFile objects for export.
 * Builds file paths based on Foundry folder hierarchy.
 * Handles two export modes:
 * - merge=false: Creates one file per page (journal-name/page-name.md)
 * - merge=true: Creates one file per journal with pages separated by h1 elements
 *
 * @param {ExportOptions} exportOptions - Export configuration with journals and merge preference
 * @returns {MarkdownFile[]} Array of markdown files with HTML content ready for conversion
 */
export default function fetchJournalContent(exportOptions) {
    const markdownFiles = [];

    for (const journal of exportOptions.journals) {
        if (!journal.pages || journal.pages.size === 0) {
            continue;
        }

        const folderPath = buildFolderPath(journal);
        const journalName = sanitizeName(journal.name);

        if (exportOptions.merge) {
            const filePath = folderPath
                ? `${folderPath}/${journalName}.md`
                : `${journalName}.md`;

            const content = Array.from(journal.pages.values())
                .map(page => `<h1>${page.name}</h1>\n${page.text.content}`)
                .join('\n\n');

            markdownFiles.push(new MarkdownFile({
                filePath,
                lookupKeys: generateLookupKeys(filePath),
                content,
                links: [],
                assets: []
            }));
        } else {
            for (const page of journal.pages.values()) {
                const pageName = sanitizeName(page.name);
                const filePath = folderPath
                    ? `${folderPath}/${journalName}/${pageName}.md`
                    : `${journalName}/${pageName}.md`;

                markdownFiles.push(new MarkdownFile({
                    filePath,
                    lookupKeys: generateLookupKeys(filePath),
                    content: page.text.content,
                    links: [],
                    assets: []
                }));
            }
        }
    }

    return markdownFiles;
}
