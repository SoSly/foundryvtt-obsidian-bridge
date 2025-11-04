import ImportDialog from '../ui/ImportDialog.js';
import ExportDialog from '../ui/ExportDialog.js';
import { registerHandlebarsHelpers } from './registerHandlebarsHelpers.js';

let importDialogInstance = null;
let exportDialogInstance = null;

async function onRenderJournalDirectory(app, htmlOrElement, data) {
    const html = htmlOrElement instanceof HTMLElement ? htmlOrElement : htmlOrElement[0];

    let footer = html.querySelector('.directory-footer');
    if (!footer) {
        footer = document.createElement('footer');
        footer.className = 'directory-footer action-buttons flexrow';
        html.appendChild(footer);
    }

    const container = document.createElement('div');
    container.className = 'header-actions action-buttons flexrow';

    const importTemplatePath = 'modules/obsidian-bridge/templates/import-button.hbs';
    const importTemplate = await getTemplate(importTemplatePath);
    const importButtonHtml = importTemplate({});

    const tempImport = document.createElement('div');
    tempImport.innerHTML = importButtonHtml;
    const importButton = tempImport.firstElementChild;
    importButton.addEventListener('click', () => {
        if (importDialogInstance && importDialogInstance.rendered) {
            importDialogInstance.bringToFront();
            return;
        }

        importDialogInstance = new ImportDialog();
        importDialogInstance.render({ force: true });
    });

    container.appendChild(importButton);

    const exportTemplatePath = 'modules/obsidian-bridge/templates/export-button.hbs';
    const exportTemplate = await getTemplate(exportTemplatePath);
    const exportButtonHtml = exportTemplate({});

    const tempExport = document.createElement('div');
    tempExport.innerHTML = exportButtonHtml;
    const exportButton = tempExport.firstElementChild;
    exportButton.addEventListener('click', () => {
        if (exportDialogInstance && exportDialogInstance.rendered) {
            exportDialogInstance.bringToFront();
            return;
        }

        exportDialogInstance = new ExportDialog();
        exportDialogInstance.render({ force: true });
    });

    container.appendChild(exportButton);
    footer.appendChild(container);
}

export async function registerImportHooks() {
    await registerHandlebarsHelpers();
    Hooks.on('renderJournalDirectory', onRenderJournalDirectory);
}
