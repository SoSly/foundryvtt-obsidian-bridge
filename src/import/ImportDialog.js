const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ImportDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.vaultPath = '';
        this.vaultFiles = null;
        this.combineNotes = false;
        this.skipFolderCombine = false;
        this.importAssets = false;
        this.dataPath = '';
    }

    static DEFAULT_OPTIONS = {
        id: 'obsidian-bridge-import',
        classes: ['obsidian-bridge', 'import-dialog'],
        tag: 'form',
        window: {
            frame: true,
            positioned: true,
            title: 'obsidian-bridge.import.dialog-title',
            icon: 'fas fa-file-import',
            minimizable: false,
            resizable: false
        },
        actions: {
            selectVault: ImportDialog._onSelectVault
        },
        form: {
            handler: ImportDialog._onSubmit,
            submitOnChange: false,
            closeOnSubmit: false
        },
        position: {
            width: 520,
            height: 'auto'
        }
    };

    static PARTS = {
        form: {
            template: 'modules/obsidian-bridge/templates/import-dialog.hbs'
        }
    };

    async _prepareContext(options) {
        return {
            vaultPath: this.vaultPath,
            combineNotes: this.combineNotes,
            skipFolderCombine: this.skipFolderCombine,
            importAssets: this.importAssets,
            dataPath: this.dataPath
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const fileInput = this.element.querySelector('.vault-input');
        if (!fileInput) {
            return;
        }

        fileInput.addEventListener('change', event => {
            const files = event.target.files;
            if (!files || files.length === 0) {
                return;
            }

            this.vaultFiles = files;
            const firstFile = files[0];
            const pathParts = firstFile.webkitRelativePath.split('/');
            this.vaultPath = pathParts[0];

            const pathInput = this.element.querySelector('.vault-path');
            if (pathInput) {
                pathInput.value = this.vaultPath;
            }
        });
    }

    static _onSelectVault(event, target) {
        event.preventDefault();

        const formGroup = target.closest('.form-group');
        if (!formGroup) {
            return;
        }

        const fileInput = formGroup.querySelector('input[type="file"]');
        if (!fileInput) {
            return;
        }

        fileInput.click();
    }

    static async _onSubmit(event, form, formData) {
        const data = formData.object;

        this.combineNotes = data.combineNotes || false;
        this.skipFolderCombine = data.skipFolderCombine || false;
        this.importAssets = data.importAssets || false;
        this.dataPath = data.dataPath || '';

        if (!this.vaultFiles || this.vaultFiles.length === 0) {
            ui.notifications.warn(game.i18n.localize('obsidian-bridge.import.vault-path-hint'));
            return;
        }

        ui.notifications.info('Import functionality not yet implemented');
    }
}
