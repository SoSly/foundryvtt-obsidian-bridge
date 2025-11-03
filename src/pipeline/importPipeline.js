import PipelineConfig from '../domain/PipelineConfig';
import PhaseDefinition from '../domain/PhaseDefinition';
import MarkdownFile from '../domain/MarkdownFile.js';
import { collectSelectedPaths } from '../tree/collect';
import { filterFilesBySelection } from '../vault/filter';
import { extractLinkReferences, extractAssetReferences } from '../reference/extractFromMarkdown.js';
import generateLookupKeys from '../reference/keys.js';
import replaceWithPlaceholders from '../reference/replace.js';
import planJournalStructure from '../journal/plan';
import resolvePlaceholders from '../reference/resolve.js';
import { createJournals, rollbackJournals } from '../journal/create';
import { uploadAssets, rollbackUploads } from '../asset/upload';
import { updateContent, rollbackUpdates } from '../journal/update';

/**
 * Creates a configured pipeline for importing an Obsidian vault into Foundry.
 *
 * Pipeline phases:
 * 1. Filter files - Select files based on tree selection
 * 2. Extract references - Extract links and assets, replace with placeholders
 * 3. Convert markdown - Convert markdown text to HTML
 * 4. Plan structure - Determine folder and journal entry structure
 * 5. Create documents - Create Foundry folders, journal entries, and pages
 * 6. Upload assets - Upload non-markdown files to data path (conditional)
 * 7. Resolve placeholders - Replace placeholders with actual UUIDs and paths
 * 8. Update content - Write final HTML content to journal pages
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
            name: 'extract-references',
            execute: async ctx => {
                if (!ctx.filesToParse || ctx.filesToParse.length === 0) {
                    ctx.markdownFiles = [];
                    return { markdownFiles: [] };
                }

                const markdownFiles = [];

                for (const file of ctx.filesToParse) {
                    const markdownText = await file.text();
                    const links = extractLinkReferences(markdownText);
                    const assets = extractAssetReferences(markdownText);
                    const {
                        text: textWithPlaceholders,
                        links: linksWithPlaceholders,
                        assets: assetsWithPlaceholders
                    } = replaceWithPlaceholders(markdownText, links, assets);
                    const lookupKeys = generateLookupKeys(file.webkitRelativePath);

                    const markdownFile = new MarkdownFile({
                        filePath: file.webkitRelativePath,
                        lookupKeys,
                        content: textWithPlaceholders,
                        links: linksWithPlaceholders,
                        assets: assetsWithPlaceholders,
                        foundryPageUuid: null
                    });

                    markdownFiles.push(markdownFile);
                }

                ctx.markdownFiles = markdownFiles;
                return { markdownFiles };
            },
        }),

        new PhaseDefinition({
            name: 'convert-markdown',
            execute: async ctx => {
                for (const markdownFile of ctx.markdownFiles) {
                    markdownFile.content = ctx.showdownConverter.makeHtml(markdownFile.content);
                }
                return { converted: ctx.markdownFiles.length };
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
                return await createJournals(ctx.structurePlan, ctx.markdownFiles);
            },
            rollback: async (ctx, result) => {
                await rollbackJournals(
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
                await rollbackUploads(result.uploadedPaths);
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
                return await updateContent(ctx.markdownFiles);
            },
            rollback: async (ctx, result) => {
                await rollbackUpdates(result.updatedPages);
            },
        }),
    ];

    return new PipelineConfig({ phases, context });
}
