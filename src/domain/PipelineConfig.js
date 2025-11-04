/**
 * Configuration for a pipeline execution.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * @typedef {Object} ProgressState
 * @property {number} currentPhase - Zero-based index of current phase
 * @property {string} phaseLabel - i18n key for current phase label
 * @property {number} completedPhases - Number of phases completed
 * @property {number} totalPhases - Total number of phases to execute
 * @property {number} percentage - Completion percentage (0-100)
 *
 * @callback ProgressCallback
 * @param {ProgressState} state - Current progress state
 * @returns {void}
 *
 * @typedef {Object} PipelineConfigData
 * @property {import('./PhaseDefinition').default[]} phases - Ordered phases to execute
 * @property {Object} context - Shared data passed to all phases
 * @property {ProgressCallback} [onProgress] - Optional callback for progress updates
 */
export default class PipelineConfig {
    static DEFAULTS = {
        phases: [],
        context: {},
        onProgress: null
    };

    /**
     * @param {PipelineConfigData} options
     */
    constructor(options = {}) {
        Object.assign(this, PipelineConfig.DEFAULTS, options);

        if (!Array.isArray(this.phases) || this.phases.length === 0) {
            throw new Error('PipelineConfig requires at least one phase');
        }

        Object.seal(this);
    }
}
