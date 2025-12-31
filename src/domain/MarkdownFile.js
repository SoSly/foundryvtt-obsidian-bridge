/**
 * Represents a markdown file from the vault.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * Properties mutated during pipeline execution:
 * - content: Populated by resolvePlaceholders usecase
 * - frontmatter: Set during extract-frontmatter phase (import) or read from page flags (export)
 * - foundryPageUuid: Set by createJournalDocuments interface function
 */
export default class MarkdownFile {
    static DEFAULTS = {
        filePath: '',
        lookupKeys: [],
        content: '',
        frontmatter: null,
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
        if (this.content === undefined || this.content === null) {
            throw new Error('MarkdownFile requires content');
        }

        Object.seal(this);
    }
}
