/**
 * Defines a single phase in a pipeline execution.
 *
 * @typedef {Object} PhaseDefinitionData
 * @property {string} name - Unique identifier for this phase
 * @property {function(Object, Map<string, *>): Promise<*>} execute - Async function that executes the phase logic
 * @property {function(Object, *): Promise<void>} [rollback] - Optional async function to rollback this phase
 * @property {function(Object): boolean} [condition] - Optional predicate to determine if phase should execute
 */
export default class PhaseDefinition {
    /**
     * @param {PhaseDefinitionData} data
     */
    constructor(data) {
        if (!data.name || typeof data.name !== 'string') {
            throw new Error('PhaseDefinition requires a valid name');
        }
        if (typeof data.execute !== 'function') {
            throw new Error('PhaseDefinition requires an execute function');
        }
        if (data.rollback !== undefined && typeof data.rollback !== 'function') {
            throw new Error('PhaseDefinition rollback must be a function');
        }
        if (data.condition !== undefined && typeof data.condition !== 'function') {
            throw new Error('PhaseDefinition condition must be a function');
        }

        this.name = data.name;
        this.execute = data.execute;
        this.rollback = data.rollback || null;
        this.condition = data.condition || null;
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
