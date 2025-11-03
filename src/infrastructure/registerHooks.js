import ImportDialog from '../ui/ImportDialog.js';
import ExportDialog from '../ui/ExportDialog.js';
import { registerHandlebarsHelpers } from './registerHandlebarsHelpers.js';

let importDialogInstance = null;
let exportDialogInstance = null;

async function onRenderJournalDirectory(app, html, data) {
    let footer = html.find('.directory-footer');
    if (!footer.length) {
        footer = $('<footer class="directory-footer action-buttons flexrow"></footer>');
        html.append(footer);
    }

    const container = $('<div class="header-actions action-buttons flexrow"></div>');

    const importTemplatePath = 'modules/obsidian-bridge/templates/import-button.hbs';
    const importTemplate = await getTemplate(importTemplatePath);
    const importButtonHtml = importTemplate({});

    const importButton = $(importButtonHtml);
    importButton.on('click', () => {
        if (importDialogInstance && importDialogInstance.rendered) {
            importDialogInstance.bringToFront();
            return;
        }

        importDialogInstance = new ImportDialog();
        importDialogInstance.render({ force: true });
    });

    container.append(importButton);

    const exportTemplatePath = 'modules/obsidian-bridge/templates/export-button.hbs';
    const exportTemplate = await getTemplate(exportTemplatePath);
    const exportButtonHtml = exportTemplate({});

    const exportButton = $(exportButtonHtml);
    exportButton.on('click', () => {
        if (exportDialogInstance && exportDialogInstance.rendered) {
            exportDialogInstance.bringToFront();
            return;
        }

        exportDialogInstance = new ExportDialog();
        exportDialogInstance.render({ force: true });
    });

    container.append(exportButton);
    footer.append(container);
}

export async function registerImportHooks() {
    await registerHandlebarsHelpers();
    Hooks.on('renderJournalDirectory', onRenderJournalDirectory);
}
