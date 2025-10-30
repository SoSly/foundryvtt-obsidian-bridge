/**
 * Represents a markdown file from the vault.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * Properties mutated during pipeline execution:
 * - htmlContent: Populated by resolvePlaceholders usecase
 * - foundryPageUuid: Set by createJournalDocuments interface function
 */
export default class MarkdownFile {
    static DEFAULTS = {
        filePath: '',
        lookupKeys: [],
        htmlContent: '',
        links: [],
        assets: [],
        foundryPageUuid: null
    };

    constructor(options = {}) {
        Object.assign(this, MarkdownFile.DEFAULTS, options);

        if (!this.filePath || typeof this.filePath !== 'string') {
            throw new Error('MarkdownFile requires a valid filePath string');
        }
        if (!Array.isArray(this.lookupKeys)) {
            throw new Error('MarkdownFile requires lookupKeys array');
        }
        if (this.htmlContent === undefined || this.htmlContent === null) {
            throw new Error('MarkdownFile requires htmlContent');
        }

        Object.seal(this);
    }
}
