import PipelineResult from '../domain/PipelineResult';

/**
 * Execute a pipeline of phases with automatic rollback on failure.
 *
 * Phases execute sequentially. Each phase can:
 * - Access the shared context
 * - Return a result that's tracked
 * - Be conditionally skipped
 * - Define a rollback function
 *
 * If any phase fails, all previously executed phases with rollback functions
 * are rolled back in reverse order.
 *
 * If config.onProgress is provided, it will be called before each phase execution
 * with current progress state.
 *
 * @param {import('../domain/PipelineConfig').default} config - Pipeline configuration
 * @returns {Promise<import('../domain/PipelineResult').default>}
 */
export default async function executePipeline(config) {
    const executedPhases = [];
    const phaseResults = new Map();

    const phasesToExecute = config.phases.filter(phase => phase.shouldExecute(config.context));
    const totalPhases = phasesToExecute.length;

    try {
        for (let i = 0; i < phasesToExecute.length; i++) {
            const phase = phasesToExecute[i];

            if (config.onProgress) {
                config.onProgress({
                    currentPhase: i,
                    phaseLabel: `obsidian-bridge.progress.${phase.name}`,
                    completedPhases: i,
                    totalPhases,
                    percentage: Math.round((i / totalPhases) * 100)
                });
            }

            const result = await phase.execute(config.context, phaseResults);
            phaseResults.set(phase.name, result);
            executedPhases.push({ phase, result });
        }

        if (config.onProgress) {
            config.onProgress({
                currentPhase: totalPhases,
                phaseLabel: 'obsidian-bridge.progress.complete',
                completedPhases: totalPhases,
                totalPhases,
                percentage: 100
            });
        }

        return new PipelineResult({
            success: true,
            phaseResults,
        });
    } catch (error) {
        const failedPhase = executedPhases.length > 0
            ? config.phases[executedPhases.length]?.name
            : config.phases[0]?.name;

        await rollbackExecutedPhases(executedPhases, config.context);

        return new PipelineResult({
            success: false,
            phaseResults,
            error,
            failedPhase,
        });
    }
}

/**
 * Rollback all executed phases in reverse order
 *
 * @param {Array<{phase: import('../domain/PhaseDefinition').default, result: *}>} executedPhases
 * @param {Object} context
 * @returns {Promise<void>}
 */
async function rollbackExecutedPhases(executedPhases, context) {
    const reversedPhases = [...executedPhases].reverse();

    for (const { phase, result } of reversedPhases) {
        if (!phase.rollback) {
            continue;
        }

        try {
            await phase.rollback(context, result);
        } catch (rollbackError) {
            console.error(`Failed to rollback phase ${phase.name}:`, rollbackError);
        }
    }
}
