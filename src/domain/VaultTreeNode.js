export default class VaultTreeNode {
    static DEFAULTS = {
        name: '',
        path: '',
        isDirectory: false,
        isSelected: true,
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
    }
}
