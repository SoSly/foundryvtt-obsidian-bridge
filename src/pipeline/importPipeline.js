import PipelineConfig from '../domain/PipelineConfig';
import PhaseDefinition from '../domain/PhaseDefinition';
import { collectSelectedPaths } from '../usecase/import/collectSelectedPaths';
import { filterFilesBySelection } from '../usecase/import/filterFilesBySelection';
import parseMarkdownFiles from '../usecase/import/parseMarkdownFiles';
import planJournalStructure from '../usecase/import/planJournalStructure';
import resolvePlaceholders from '../usecase/import/resolvePlaceholders';
import { createJournalDocuments, rollbackJournalDocuments } from '../interface/import/createJournalDocuments';
import { uploadAssets, rollbackAssetUploads } from '../interface/import/uploadAssets';
import updatePageContent from '../interface/import/updatePageContent';
import rollbackPageUpdates from '../interface/import/rollbackPageUpdates';

/**
 * Creates a configured pipeline for importing an Obsidian vault into Foundry.
 *
 * Pipeline phases:
 * 1. Filter files - Select files based on tree selection
 * 2. Parse markdown - Convert markdown to HTML with placeholders
 * 3. Plan structure - Determine folder and journal entry structure
 * 4. Create documents - Create Foundry folders, journal entries, and pages
 * 5. Upload assets - Upload non-markdown files to data path (conditional)
 * 6. Resolve placeholders - Replace placeholders with actual UUIDs and paths
 * 7. Update content - Write final HTML content to journal pages
 *
 * @param {import('../domain/ImportOptions').default} importOptions - Import configuration
 * @param {import('showdown').Converter} showdownConverter - Markdown to HTML converter
 * @returns {import('../domain/PipelineConfig').default}
 */
export default function createImportPipeline(importOptions, showdownConverter) {
    const context = {
        importOptions,
        showdownConverter,
        originalVaultFiles: importOptions.vaultFiles,
        filesToParse: null,
        markdownFiles: null,
        structurePlan: null,
    };

    const phases = [
        new PhaseDefinition({
            name: 'filter-files',
            execute: async ctx => {
                if (!ctx.importOptions.vaultFileTree) {
                    ctx.filesToParse = ctx.originalVaultFiles;
                    return { filesSelected: ctx.originalVaultFiles.length };
                }

                const selectedPaths = collectSelectedPaths(ctx.importOptions.vaultFileTree);
                const selectedFiles = filterFilesBySelection(ctx.originalVaultFiles, selectedPaths);

                if (selectedFiles.length === 0) {
                    throw new Error('No files selected for import');
                }

                ctx.filesToParse = selectedFiles;
                return { filesSelected: selectedFiles.length };
            },
        }),

        new PhaseDefinition({
            name: 'parse-markdown',
            execute: async ctx => {
                const markdownFiles = await parseMarkdownFiles(ctx.showdownConverter, ctx.filesToParse);
                ctx.markdownFiles = markdownFiles;
                return { markdownFiles };
            },
        }),

        new PhaseDefinition({
            name: 'plan-structure',
            execute: async ctx => {
                const structurePlan = planJournalStructure(ctx.markdownFiles, ctx.importOptions);
                ctx.structurePlan = structurePlan;
                return { structurePlan };
            },
        }),

        new PhaseDefinition({
            name: 'create-documents',
            execute: async ctx => {
                return await createJournalDocuments(ctx.structurePlan, ctx.markdownFiles);
            },
            rollback: async (ctx, result) => {
                await rollbackJournalDocuments(
                    result.createdPages,
                    result.createdEntries,
                    result.createdFolders
                );
            },
        }),

        new PhaseDefinition({
            name: 'upload-assets',
            execute: async ctx => {
                return await uploadAssets(ctx.markdownFiles, ctx.originalVaultFiles, ctx.importOptions);
            },
            rollback: async (ctx, result) => {
                await rollbackAssetUploads(result.uploadedPaths);
            },
            condition: ctx => ctx.importOptions.importAssets,
        }),

        new PhaseDefinition({
            name: 'resolve-placeholders',
            execute: async (ctx, phaseResults) => {
                const uploadResult = phaseResults?.get('upload-assets');
                const nonMarkdownFiles = uploadResult?.nonMarkdownFiles || [];
                resolvePlaceholders(ctx.markdownFiles, nonMarkdownFiles);
                return { placeholdersResolved: true };
            },
        }),

        new PhaseDefinition({
            name: 'update-content',
            execute: async ctx => {
                return await updatePageContent(ctx.markdownFiles);
            },
            rollback: async (ctx, result) => {
                await rollbackPageUpdates(result.updatedPages);
            },
        }),
    ];

    return new PipelineConfig({ phases, context });
}
