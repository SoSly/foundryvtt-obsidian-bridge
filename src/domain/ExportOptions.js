/**
 * Configuration options for exporting Foundry journals to markdown files.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * @property {JournalEntry[]} journals - Array of Foundry JournalEntry documents to export
 * @property {boolean} merge - If true, merge all pages into one file per journal;
 *                               if false, create separate files per page
 */
export default class ExportOptions {
    static DEFAULTS = {
        journals: [],
        merge: false
    };

    constructor(options = {}) {
        Object.assign(this, ExportOptions.DEFAULTS, options);

        if (!this.journals || this.journals.length === 0) {
            throw new Error('ExportOptions requires at least one journal');
        }

        Object.seal(this);
    }
}
