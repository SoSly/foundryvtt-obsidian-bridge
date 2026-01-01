/**
 * Represents an Obsidian callout block parsed from markdown.
 * Object is sealed after construction to prevent accidental property additions.
 */
export default class Callout {
    static DEFAULTS = {
        type: '',
        title: '',
        customTitle: false,
        foldable: false,
        defaultOpen: true,
        body: ''
    };

    constructor(options = {}) {
        Object.assign(this, Callout.DEFAULTS, options);

        if (!this.type || typeof this.type !== 'string') {
            throw new Error('Callout requires a valid type string');
        }

        Object.seal(this);
    }
}
