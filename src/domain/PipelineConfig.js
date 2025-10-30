/**
 * Configuration for a pipeline execution.
 *
 * @typedef {Object} PipelineConfigData
 * @property {import('./PhaseDefinition').default[]} phases - Ordered phases to execute
 * @property {Object} context - Shared data passed to all phases
 */
export default class PipelineConfig {
    /**
     * @param {PipelineConfigData} data
     */
    constructor(data) {
        if (!Array.isArray(data.phases) || data.phases.length === 0) {
            throw new Error('PipelineConfig requires at least one phase');
        }

        this.phases = data.phases;
        this.context = data.context || {};
    }
}
