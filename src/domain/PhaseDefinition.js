/**
 * Defines a single phase in a pipeline execution.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * @typedef {Object} PhaseDefinitionData
 * @property {string} name - Unique identifier for this phase
 * @property {function(Object, Map<string, *>): Promise<*>} execute - Async function that executes the phase logic
 * @property {function(Object, *): Promise<void>} [rollback] - Optional async function to rollback this phase
 * @property {function(Object): boolean} [condition] - Optional predicate to determine if phase should execute
 */
export default class PhaseDefinition {
    static DEFAULTS = {
        name: '',
        execute: null,
        rollback: null,
        condition: null
    };

    /**
     * @param {PhaseDefinitionData} options
     */
    constructor(options = {}) {
        Object.assign(this, PhaseDefinition.DEFAULTS, options);

        if (!this.name || typeof this.name !== 'string') {
            throw new Error('PhaseDefinition requires a valid name');
        }
        if (typeof this.execute !== 'function') {
            throw new Error('PhaseDefinition requires an execute function');
        }
        if (this.rollback !== null && typeof this.rollback !== 'function') {
            throw new Error('PhaseDefinition rollback must be a function');
        }
        if (this.condition !== null && typeof this.condition !== 'function') {
            throw new Error('PhaseDefinition condition must be a function');
        }

        Object.seal(this);
    }

    /**
     * Check if this phase should execute given the current context
     *
     * @param {Object} context - Shared pipeline context
     * @returns {boolean}
     */
    shouldExecute(context) {
        if (!this.condition) {
            return true;
        }
        return this.condition(context);
    }
}
