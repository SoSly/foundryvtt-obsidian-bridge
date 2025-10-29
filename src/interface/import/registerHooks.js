import ImportDialog from './ImportDialog.js';

let importDialogInstance = null;

async function onRenderJournalDirectory(app, html, data) {
    const header = html.find('.directory-header');
    if (!header.length) {
        return;
    }

    const templatePath = 'modules/obsidian-bridge/templates/import-button.hbs';
    const template = await getTemplate(templatePath);
    const buttonHtml = template({});

    const button = $(buttonHtml);
    button.on('click', () => {
        if (importDialogInstance && importDialogInstance.rendered) {
            importDialogInstance.bringToFront();
            return;
        }

        importDialogInstance = new ImportDialog();
        importDialogInstance.render({ force: true });
    });

    header.append(button);
}

export function registerImportHooks() {
    Hooks.on('renderJournalDirectory', onRenderJournalDirectory);
}
