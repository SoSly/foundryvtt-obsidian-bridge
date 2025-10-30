export default class JournalStructurePlan {
    static DEFAULTS = {
        folders: [],
        entries: []
    };

    constructor(options = {}) {
        Object.assign(this, JournalStructurePlan.DEFAULTS, options);

        if (!Array.isArray(this.folders)) {
            throw new Error('folders must be an array');
        }
        if (!Array.isArray(this.entries)) {
            throw new Error('entries must be an array');
        }
    }
}
