/**
 * Result of a pipeline execution.
 * Object is sealed after construction to prevent accidental property additions.
 * The phaseResults Map is mutated as phases execute.
 *
 * @typedef {Object} PipelineResultData
 * @property {boolean} success - Whether the pipeline completed successfully
 * @property {Map<string, *>} phaseResults - Results from each executed phase, keyed by phase name
 * @property {Error} [error] - Error that caused pipeline failure, if any
 * @property {string} [failedPhase] - Name of the phase that failed, if any
 */
export default class PipelineResult {
    static DEFAULTS = {
        success: false,
        phaseResults: null,
        error: null,
        failedPhase: null
    };

    /**
     * @param {PipelineResultData} options
     */
    constructor(options = {}) {
        Object.assign(this, PipelineResult.DEFAULTS, options);

        if (!this.phaseResults) {
            this.phaseResults = new Map();
        }

        Object.seal(this);
    }

    /**
     * Get the result from a specific phase
     *
     * @param {string} phaseName
     * @returns {*}
     */
    getPhaseResult(phaseName) {
        return this.phaseResults.get(phaseName);
    }

    /**
     * Check if a specific phase was executed
     *
     * @param {string} phaseName
     * @returns {boolean}
     */
    hasPhaseResult(phaseName) {
        return this.phaseResults.has(phaseName);
    }
}
