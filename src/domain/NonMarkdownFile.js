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
    }
}
