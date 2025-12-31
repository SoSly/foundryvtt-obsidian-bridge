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
        strictLineBreaks: false,
        dataPath: ''
    };

    constructor(options = {}) {
        Object.assign(this, ImportOptions.DEFAULTS, options);
        Object.seal(this);
    }

    isValid() {
        if (!this.vaultFiles || this.vaultFiles.length === 0) {
            return false;
        }

        if (!this.vaultFileTree) {
            return false;
        }

        if (this.importAssets && !this.dataPath) {
            return false;
        }

        if (this.skipFolderCombine && !this.combineNotes) {
            return false;
        }

        return true;
    }
}
