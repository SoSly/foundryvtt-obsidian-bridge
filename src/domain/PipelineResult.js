/**
 * Result of a pipeline execution.
 *
 * @typedef {Object} PipelineResultData
 * @property {boolean} success - Whether the pipeline completed successfully
 * @property {Map<string, *>} phaseResults - Results from each executed phase, keyed by phase name
 * @property {Error} [error] - Error that caused pipeline failure, if any
 * @property {string} [failedPhase] - Name of the phase that failed, if any
 */
export default class PipelineResult {
    /**
     * @param {PipelineResultData} data
     */
    constructor(data = {}) {
        this.success = data.success ?? false;
        this.phaseResults = data.phaseResults || new Map();
        this.error = data.error || null;
        this.failedPhase = data.failedPhase || null;
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
