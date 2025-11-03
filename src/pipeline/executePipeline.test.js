import { describe, test, expect, jest } from '@jest/globals';
import executePipeline from './executePipeline';
import PipelineConfig from '../domain/PipelineConfig';
import PhaseDefinition from '../domain/PhaseDefinition';

describe('executePipeline', () => {
    test('executes all phases in order and returns success', async () => {
        const executionOrder = [];
        const context = { value: 1 };

        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async ctx => {
                    executionOrder.push('phase1');
                    return { result: ctx.value + 1 };
                },
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async ctx => {
                    executionOrder.push('phase2');
                    return { result: ctx.value + 2 };
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(true);
        expect(result.error).toBeNull();
        expect(executionOrder).toEqual(['phase1', 'phase2']);
        expect(result.getPhaseResult('phase1')).toEqual({ result: 2 });
        expect(result.getPhaseResult('phase2')).toEqual({ result: 3 });
    });

    test('provides phase results to subsequent phases', async () => {
        const context = {};
        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async () => ({ value: 10 }),
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async (ctx, phaseResults) => {
                    const phase1Result = phaseResults.get('phase1');
                    return { doubled: phase1Result.value * 2 };
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(true);
        expect(result.getPhaseResult('phase2')).toEqual({ doubled: 20 });
    });

    test('skips phases when condition returns false', async () => {
        const executionOrder = [];
        const context = { skipPhase2: true };

        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async () => {
                    executionOrder.push('phase1');
                    return { result: 1 };
                },
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async () => {
                    executionOrder.push('phase2');
                    return { result: 2 };
                },
                condition: ctx => !ctx.skipPhase2,
            }),
            new PhaseDefinition({
                name: 'phase3',
                execute: async () => {
                    executionOrder.push('phase3');
                    return { result: 3 };
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(true);
        expect(executionOrder).toEqual(['phase1', 'phase3']);
        expect(result.hasPhaseResult('phase1')).toBe(true);
        expect(result.hasPhaseResult('phase2')).toBe(false);
        expect(result.hasPhaseResult('phase3')).toBe(true);
    });

    test('rolls back all executed phases on failure', async () => {
        const rollbacks = [];
        const context = {};

        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async () => ({ data: 'phase1' }),
                rollback: async (ctx, result) => {
                    rollbacks.push({ phase: 'phase1', result });
                },
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async () => ({ data: 'phase2' }),
                rollback: async (ctx, result) => {
                    rollbacks.push({ phase: 'phase2', result });
                },
            }),
            new PhaseDefinition({
                name: 'phase3',
                execute: async () => {
                    throw new Error('Phase 3 failed');
                },
                rollback: async (ctx, result) => {
                    rollbacks.push({ phase: 'phase3', result });
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Phase 3 failed');
        expect(result.failedPhase).toBe('phase3');
        expect(rollbacks).toEqual([
            { phase: 'phase2', result: { data: 'phase2' } },
            { phase: 'phase1', result: { data: 'phase1' } },
        ]);
    });

    test('continues rollback even if a rollback fails', async () => {
        const rollbacks = [];
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const context = {};

        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async () => ({ data: 'phase1' }),
                rollback: async () => {
                    rollbacks.push('phase1');
                },
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async () => ({ data: 'phase2' }),
                rollback: async () => {
                    throw new Error('Rollback failed');
                },
            }),
            new PhaseDefinition({
                name: 'phase3',
                execute: async () => {
                    throw new Error('Phase 3 failed');
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(false);
        expect(rollbacks).toEqual(['phase1']);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to rollback phase phase2:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    test('does not rollback phases without rollback functions', async () => {
        const rollbacks = [];
        const context = {};

        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async () => ({ data: 'phase1' }),
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async () => ({ data: 'phase2' }),
                rollback: async () => {
                    rollbacks.push('phase2');
                },
            }),
            new PhaseDefinition({
                name: 'phase3',
                execute: async () => {
                    throw new Error('Phase 3 failed');
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(false);
        expect(rollbacks).toEqual(['phase2']);
    });

    test('tracks phase results even on failure', async () => {
        const context = {};

        const phases = [
            new PhaseDefinition({
                name: 'phase1',
                execute: async () => ({ value: 1 }),
            }),
            new PhaseDefinition({
                name: 'phase2',
                execute: async () => ({ value: 2 }),
            }),
            new PhaseDefinition({
                name: 'phase3',
                execute: async () => {
                    throw new Error('Failed');
                },
            }),
        ];

        const config = new PipelineConfig({ phases, context });
        const result = await executePipeline(config);

        expect(result.success).toBe(false);
        expect(result.hasPhaseResult('phase1')).toBe(true);
        expect(result.hasPhaseResult('phase2')).toBe(true);
        expect(result.hasPhaseResult('phase3')).toBe(false);
    });
});
