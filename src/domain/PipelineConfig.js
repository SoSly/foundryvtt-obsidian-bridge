/**
 * Configuration for a pipeline execution.
 * Object is sealed after construction to prevent accidental property additions.
 *
 * @typedef {Object} PipelineConfigData
 * @property {import('./PhaseDefinition').default[]} phases - Ordered phases to execute
 * @property {Object} context - Shared data passed to all phases
 */
export default class PipelineConfig {
    static DEFAULTS = {
        phases: [],
        context: {}
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
