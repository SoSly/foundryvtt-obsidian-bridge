/**
 * Configuration options for exporting Foundry journals to markdown files.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * @property {JournalEntry[]} journals - Array of Foundry JournalEntry documents to export
 * @property {boolean} merge - If true, merge all pages into one file per journal;
 *                               if false, create separate files per page
 * @property {string} assetPathPrefix - Path prefix to strip from Foundry asset URLs
 *                                      (e.g., 'worlds/my-world/obsidian-exports')
 *                                      Empty string means no stripping
 * @property {boolean} exportAssets - If true, identify and export referenced assets;
 *                                     if false, skip asset identification and export
 * @property {string} exportPath - Name of the selected export directory
 * @property {FileSystemDirectoryHandle} directoryHandle - Browser directory handle for export destination
 */
export default class ExportOptions {
    static DEFAULTS = {
        journals: [],
        merge: false,
        assetPathPrefix: '',
        exportAssets: false,
        exportPath: '',
        directoryHandle: null
    };

    constructor(options = {}) {
        Object.assign(this, ExportOptions.DEFAULTS, options);

        if (!this.journals || this.journals.length === 0) {
            throw new Error('ExportOptions requires at least one journal');
        }

        Object.seal(this);
    }
}
