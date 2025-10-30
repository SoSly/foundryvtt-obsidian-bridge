/**
 * Represents a non-markdown file (asset) from the vault.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * Properties mutated during pipeline execution:
 * - foundryDataPath: Set by uploadAssets interface function after file upload
 */
export default class NonMarkdownFile {
    static DEFAULTS = {
        filePath: '',
        foundryDataPath: null
    };

    constructor(options = {}) {
        Object.assign(this, NonMarkdownFile.DEFAULTS, options);

        if (!this.filePath || typeof this.filePath !== 'string') {
            throw new Error('NonMarkdownFile requires a valid filePath string');
        }

        Object.seal(this);
    }
}
