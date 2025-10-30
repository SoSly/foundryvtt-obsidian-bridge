/**
 * Configuration options for importing an Obsidian vault.
 * Object is sealed after construction to prevent accidental property additions.
 */
export default class ImportOptions {
    static DEFAULTS = {
        vaultPath: '',
        vaultFiles: null,
        vaultFileTree: null,
        combineNotes: false,
        skipFolderCombine: false,
        importAssets: false,
        dataPath: ''
    };

    constructor(options = {}) {
        Object.assign(this, ImportOptions.DEFAULTS, options);
        Object.seal(this);
    }

    isValid() {
        return this.vaultFiles && this.vaultFiles.length > 0;
    }
}
