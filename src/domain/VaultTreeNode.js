/**
 * Represents a node in the vault file tree.
 * Object is sealed after construction to prevent accidental property additions.
 */
export default class VaultTreeNode {
    static DEFAULTS = {
        name: '',
        path: '',
        isDirectory: false,
        isSelected: true,
        isIndeterminate: false,
        children: undefined
    };

    constructor(options = {}) {
        Object.assign(this, VaultTreeNode.DEFAULTS, options);

        if (!this.isDirectory && !this.name.endsWith('.md')) {
            throw new Error(`VaultTreeNode can only represent directories or markdown files. Got: ${this.name}`);
        }

        if (this.isDirectory && this.children === undefined) {
            this.children = [];
        }

        Object.seal(this);
    }
}
