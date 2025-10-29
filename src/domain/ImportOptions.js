export default class ImportOptions {
    static DEFAULTS = {
        vaultPath: '',
        vaultFiles: null,
        combineNotes: false,
        skipFolderCombine: false,
        importAssets: false,
        dataPath: ''
    };

    constructor(options = {}) {
        Object.assign(this, ImportOptions.DEFAULTS, options);
    }

    isValid() {
        return this.vaultFiles && this.vaultFiles.length > 0;
    }
}
