import PipelineConfig from '../domain/PipelineConfig.js';
import PhaseDefinition from '../domain/PhaseDefinition.js';
import prepareJournalsForExport from '../journal/prepare.js';
import { extractLinkReferences, extractAssetReferences } from '../reference/extractFromHTML.js';
import replaceWithPlaceholders from '../reference/replace.js';
import convertHtmlToMarkdown from '../content/htmlToMarkdown.js';

/**
 * Creates a configured pipeline for exporting Foundry journals to Obsidian format.
 *
 * Pipeline phases:
 * 1. collect-journals - Validate selected journal documents
 * 2. prepare-documents - Transform journals into MarkdownFile objects with HTML content
 * 3. extract-references - Extract links and assets from HTML
 * 4. replace-references - Replace references with placeholders
 * 5. convert-to-markdown - Convert HTML to markdown
 * 6. resolve-references - Replace placeholders with Obsidian syntax (TODO)
 * 7. identify-assets - Identify asset paths to export (TODO)
 * 8. write-vault - Write files to filesystem or ZIP (TODO)
 *
 * @param {import('../domain/ExportOptions.js').default} exportOptions - Export configuration
 * @param {import('showdown').Converter} showdownConverter - Showdown converter instance
 * @returns {import('../domain/PipelineConfig.js').default}
 */
export default function createExportPipeline(exportOptions, showdownConverter) {
    const context = {
        exportOptions,
        showdownConverter,
        journalEntries: null,
        markdownFiles: null
    };

    const phases = [
        new PhaseDefinition({
            name: 'collect-journals',
            execute: async ctx => {
                if (!ctx.exportOptions.journals || ctx.exportOptions.journals.length === 0) {
                    throw new Error('No journals provided for export');
                }

                ctx.journalEntries = ctx.exportOptions.journals;
                return { journalsCollected: ctx.journalEntries.length };
            }
        }),

        new PhaseDefinition({
            name: 'prepare-documents',
            execute: async ctx => {
                const markdownFiles = prepareJournalsForExport(
                    ctx.journalEntries,
                    { merge: ctx.exportOptions.merge }
                );

                ctx.markdownFiles = markdownFiles;
                return { markdownFiles: markdownFiles.length };
            }
        }),

        new PhaseDefinition({
            name: 'extract-references',
            execute: async ctx => {
                for (const markdownFile of ctx.markdownFiles) {
                    const links = extractLinkReferences(markdownFile.content);
                    const assets = extractAssetReferences(
                        markdownFile.content,
                        { assetPathPrefix: ctx.exportOptions.assetPathPrefix }
                    );

                    markdownFile.links = links;
                    markdownFile.assets = assets;
                }

                return {
                    linksExtracted: ctx.markdownFiles.reduce((sum, f) => sum + f.links.length, 0),
                    assetsExtracted: ctx.markdownFiles.reduce((sum, f) => sum + f.assets.length, 0)
                };
            }
        }),

        new PhaseDefinition({
            name: 'replace-references',
            execute: async ctx => {
                let totalReplacements = 0;

                for (const markdownFile of ctx.markdownFiles) {
                    const result = replaceWithPlaceholders(
                        markdownFile.content,
                        markdownFile.links,
                        markdownFile.assets
                    );

                    markdownFile.content = result.text;
                    totalReplacements += markdownFile.links.length + markdownFile.assets.length;
                }

                return {
                    filesProcessed: ctx.markdownFiles.length,
                    totalReplacements
                };
            }
        }),

        new PhaseDefinition({
            name: 'convert-to-markdown',
            execute: async ctx => {
                let filesConverted = 0;

                for (const markdownFile of ctx.markdownFiles) {
                    markdownFile.content = convertHtmlToMarkdown(
                        markdownFile.content,
                        ctx.showdownConverter
                    );
                    filesConverted++;
                }

                return { filesConverted };
            }
        })
    ];

    return new PipelineConfig({ phases, context });
}
