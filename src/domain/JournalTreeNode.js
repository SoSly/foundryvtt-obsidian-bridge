/**
 * Represents a node in the Foundry journal/folder tree for export selection.
 * Object is sealed after construction to prevent accidental property additions.
 */
export default class JournalTreeNode {
    static DEFAULTS = {
        id: '',
        name: '',
        type: '',
        isSelected: true,
        isIndeterminate: false,
        children: undefined,
        document: null
    };

    constructor(options = {}) {
        Object.assign(this, JournalTreeNode.DEFAULTS, options);

        if (!this.id) {
            throw new Error('JournalTreeNode requires id');
        }

        if (!this.name) {
            throw new Error('JournalTreeNode requires name');
        }

        if (this.type !== 'journal' && this.type !== 'folder') {
            throw new Error(`JournalTreeNode type must be 'journal' or 'folder'. Got: ${this.type}`);
        }

        if (this.type === 'folder' && this.children === undefined) {
            this.children = [];
        }

        Object.seal(this);
    }
}
