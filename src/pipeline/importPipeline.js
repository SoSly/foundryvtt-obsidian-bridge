import PipelineConfig from '../domain/PipelineConfig';
import PhaseDefinition from '../domain/PhaseDefinition';
import { collectSelectedPaths } from '../tree/collect';
import { filterFilesBySelection } from '../vault/filter';
import prepareFilesForImport from '../vault/prepare.js';
import { extractLinkReferences, extractAssetReferences } from '../reference/extractFromMarkdown.js';
import replaceWithPlaceholders from '../reference/replace.js';
import planJournalStructure from '../journal/plan';
import resolvePlaceholders from '../reference/resolve.js';
import { createJournals, rollbackJournals } from '../journal/create';
import { uploadAssets, rollbackUploads } from '../asset/upload';
import { updateContent, rollbackUpdates } from '../journal/update';
import { extractFrontmatter } from '../content/frontmatter.js';
import convertNewlinesToBr from '../content/markdownPreprocess.js';

/**
 * Creates a configured pipeline for importing an Obsidian vault into Foundry.
 *
 * Pipeline phases:
 * 1. Filter files - Select files based on tree selection
 * 2. Prepare documents - Read file content and create MarkdownFile objects
 * 3. Extract frontmatter - Extract YAML frontmatter before markdown processing
 * 4. Convert line breaks - Convert single newlines to <br /> (conditional on strictLineBreaks)
 * 5. Extract references - Extract links and assets from markdown
 * 6. Replace references - Replace references with placeholders
 * 7. Convert markdown - Convert markdown text to HTML
 * 8. Plan structure - Determine folder and journal entry structure
 * 9. Create documents - Create Foundry folders, journal entries, and pages
 * 10. Upload assets - Upload non-markdown files to data path (conditional)
 * 11. Resolve placeholders - Replace placeholders with actual UUIDs and paths
 * 12. Update content - Write final HTML content to journal pages
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
            name: 'prepare-documents',
            execute: async ctx => {
                const markdownFiles = await prepareFilesForImport(ctx.filesToParse);
                ctx.markdownFiles = markdownFiles;
                return { markdownFiles: markdownFiles.length };
            }
        }),

        new PhaseDefinition({
            name: 'extract-frontmatter',
            execute: async ctx => {
                let count = 0;
                for (const markdownFile of ctx.markdownFiles) {
                    const result = extractFrontmatter(markdownFile.content);
                    markdownFile.frontmatter = result.frontmatter;
                    markdownFile.content = result.content;
                    if (result.frontmatter !== null) {
                        count++;
                    }
                }
                return { frontmatterExtracted: count };
            }
        }),

        new PhaseDefinition({
            name: 'convert-line-breaks',
            execute: async ctx => {
                let filesConverted = 0;
                for (const markdownFile of ctx.markdownFiles) {
                    markdownFile.content = convertNewlinesToBr(markdownFile.content);
                    filesConverted++;
                }
                return { filesConverted };
            },
            condition: ctx => !ctx.importOptions.strictLineBreaks
        }),

        new PhaseDefinition({
            name: 'extract-references',
            execute: async ctx => {
                for (const markdownFile of ctx.markdownFiles) {
                    const links = extractLinkReferences(markdownFile.content);
                    const assets = extractAssetReferences(markdownFile.content);

                    markdownFile.links = links;
                    markdownFile.assets = assets;
                }

                return {
                    linksExtracted: ctx.markdownFiles.reduce((sum, f) => sum + f.links.length, 0),
                    assetsExtracted: ctx.markdownFiles.reduce((sum, f) => sum + f.assets.length, 0)
                };
            },
        }),

        new PhaseDefinition({
            name: 'replace-references',
            execute: async ctx => {
                for (const markdownFile of ctx.markdownFiles) {
                    const result = replaceWithPlaceholders(
                        markdownFile.content,
                        markdownFile.links,
                        markdownFile.assets
                    );

                    markdownFile.content = result.text;
                }

                return { filesTransformed: ctx.markdownFiles.length };
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
