/**
 * Represents a reference to a document or asset, tracking bidirectional transformations
 * between Obsidian and Foundry formats.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * Properties mutated during pipeline execution:
 * - placeholder: Set by replaceWithPlaceholders usecase
 * - foundry: Set by resolvePlaceholders usecase
 */
export default class Reference {
    static DEFAULTS = {
        source: '',
        obsidian: '',
        foundry: null,
        label: null,
        placeholder: null,
        type: 'document',
        isImage: false,
        metadata: {}
    };

    constructor(options = {}) {
        Object.assign(this, Reference.DEFAULTS, options);

        if (!this.source || typeof this.source !== 'string') {
            throw new Error('Reference requires a valid source string');
        }
        if ((!this.obsidian || typeof this.obsidian !== 'string')
            && (!this.foundry || typeof this.foundry !== 'string')) {
            throw new Error('Reference requires either obsidian or foundry to be a valid string');
        }
        if (!['document', 'asset'].includes(this.type)) {
            throw new Error('Reference type must be "document" or "asset"');
        }

        if (!this.metadata || typeof this.metadata !== 'object') {
            this.metadata = {};
        }

        Object.seal(this);
    }
}
