import ImportOptions from '../../domain/ImportOptions';
import { buildFileTree } from '../../usecase/import/buildFileTree';
import { collectSelectedPaths } from '../../usecase/import/collectSelectedPaths';
import { filterFilesBySelection } from '../../usecase/import/filterFilesBySelection';
import parseMarkdownFiles from '../../usecase/import/parseMarkdownFiles';
import planJournalStructure from '../../usecase/import/planJournalStructure';
import resolvePlaceholders from '../../usecase/import/resolvePlaceholders';
import { annotateTreeForDisplay } from '../../usecase/import/annotateTreeForDisplay';
import { findNodeByPath } from '../../usecase/import/findNodeByPath';
import { updateTreeSelection } from '../../usecase/import/updateTreeSelection';
import { createJournalDocuments, rollbackJournalDocuments } from './createJournalDocuments';
import { uploadAssets, rollbackAssetUploads } from './uploadAssets';
import updatePageContent from './updatePageContent';
import rollbackPageUpdates from './rollbackPageUpdates';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ImportDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.importOptions = new ImportOptions({
            dataPath: `worlds/${game.world.id}/obsidian-assets`
        });
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
            width: 650,
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
            vaultPath: this.importOptions.vaultPath,
            vaultFileTree: this.importOptions.vaultFileTree,
            combineNotes: this.importOptions.combineNotes,
            skipFolderCombine: this.importOptions.skipFolderCombine,
            importAssets: this.importOptions.importAssets,
            dataPath: this.importOptions.dataPath
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const fileInput = this.element.querySelector('.vault-input');
        if (!fileInput) {
            return;
        }

        fileInput.addEventListener('change', async event => {
            const files = event.target.files;
            if (!files || files.length === 0) {
                return;
            }

            this.importOptions.vaultFiles = files;
            const firstFile = files[0];
            const pathParts = firstFile.webkitRelativePath.split('/');
            this.importOptions.vaultPath = pathParts[0];
            this.importOptions.vaultFileTree = buildFileTree(files);

            await this.render();
        });

        const combineNotesCheckbox = this.element.querySelector('input[name="combineNotes"]');
        if (combineNotesCheckbox) {
            combineNotesCheckbox.addEventListener('change', async event => {
                this.importOptions.combineNotes = event.target.checked;
                await this.render();
            });
        }

        const importAssetsCheckbox = this.element.querySelector('input[name="importAssets"]');
        if (importAssetsCheckbox) {
            importAssetsCheckbox.addEventListener('change', async event => {
                this.importOptions.importAssets = event.target.checked;
                await this.render();
            });
        }

        this._renderTree();
    }

    _renderTree() {
        const treeContainer = this.element.querySelector('#vault-file-tree');
        if (!treeContainer || !this.importOptions.vaultFileTree) {
            return;
        }

        const annotatedTree = annotateTreeForDisplay(this.importOptions.vaultFileTree, true, true);
        const template = Handlebars.partials['tree-node'];
        treeContainer.innerHTML = template(annotatedTree);

        const toggleButtons = treeContainer.querySelectorAll('.tree-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                this._handleToggleFolder(button);
            });
        });

        const checkboxes = treeContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this._handleCheckboxChange(checkbox);
            });
        });

        this._syncCheckboxStates();
    }


    _handleToggleFolder(toggleButton) {
        const folderItem = toggleButton.closest('.tree-item.folder');
        if (!folderItem) {
            return;
        }

        const isExpanded = folderItem.classList.contains('expanded');
        const childrenContainer = folderItem.querySelector(':scope > .tree-children');
        const icon = toggleButton.querySelector('i');

        if (!childrenContainer || !icon) {
            return;
        }

        if (isExpanded) {
            folderItem.classList.remove('expanded');
            folderItem.classList.add('collapsed');
            childrenContainer.style.display = 'none';
            icon.classList.remove('fa-caret-down');
            icon.classList.add('fa-caret-right');
        } else {
            folderItem.classList.remove('collapsed');
            folderItem.classList.add('expanded');
            childrenContainer.style.display = 'block';
            icon.classList.remove('fa-caret-right');
            icon.classList.add('fa-caret-down');
        }
    }

    _handleCheckboxChange(checkbox) {
        const treeItem = checkbox.closest('.tree-item');
        if (!treeItem) {
            return;
        }

        const path = treeItem.dataset.path;
        const isChecked = checkbox.checked;
        updateTreeSelection(this.importOptions.vaultFileTree, path, isChecked);
        this._syncCheckboxStates();
    }

    _syncCheckboxStates() {
        const treeContainer = this.element.querySelector('#vault-file-tree');
        if (!treeContainer) {
            return;
        }

        const allTreeItems = treeContainer.querySelectorAll('.tree-item');
        allTreeItems.forEach(item => {
            const path = item.dataset.path;
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (!checkbox) {
                return;
            }

            const node = findNodeByPath(this.importOptions.vaultFileTree, path);
            if (node) {
                checkbox.checked = node.isSelected;
                checkbox.indeterminate = node.isIndeterminate || false;
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

        this.importOptions.combineNotes = data.combineNotes || false;
        this.importOptions.skipFolderCombine = data.skipFolderCombine || false;
        this.importOptions.importAssets = data.importAssets || false;
        this.importOptions.dataPath = data.dataPath || '';

        if (!this.importOptions.isValid()) {
            ui.notifications.warn(game.i18n.localize('obsidian-bridge.import.vault-path-hint'));
            return;
        }

        const originalVaultFiles = this.importOptions.vaultFiles;
        let filesToParse = originalVaultFiles;

        if (this.importOptions.vaultFileTree) {
            const selectedPaths = collectSelectedPaths(this.importOptions.vaultFileTree);
            const selectedFiles = filterFilesBySelection(originalVaultFiles, selectedPaths);

            if (selectedFiles.length === 0) {
                ui.notifications.warn('No files selected for import');
                return;
            }

            filesToParse = selectedFiles;
        }

        const showdownConverter = new showdown.Converter();
        Object.entries(CONST.SHOWDOWN_OPTIONS).forEach(([k, v]) => {
            showdownConverter.setOption(k, v);
        });

        const markdownFiles = await parseMarkdownFiles(showdownConverter, filesToParse);
        const structurePlan = planJournalStructure(markdownFiles, this.importOptions);

        let phase3Result = null;
        let phase4Result = null;
        let phase6Result = null;

        try {
            phase3Result = await createJournalDocuments(structurePlan, markdownFiles);

            if (this.importOptions.importAssets) {
                phase4Result = await uploadAssets(markdownFiles, originalVaultFiles, this.importOptions);
            }

            resolvePlaceholders(markdownFiles, phase4Result?.nonMarkdownFiles || []);

            phase6Result = await updatePageContent(markdownFiles);

        } catch (error) {
            console.error('Import failed:', error);

            if (phase6Result) {
                await rollbackPageUpdates(phase6Result.updatedPages);
            }

            if (phase4Result) {
                await rollbackAssetUploads(phase4Result.uploadedPaths);
            }

            if (phase3Result) {
                await rollbackJournalDocuments(
                    phase3Result.createdPages,
                    phase3Result.createdEntries,
                    phase3Result.createdFolders
                );
            }

            ui.notifications.error(`Import failed: ${error.message}`);
            return;
        }

        const assetCount = phase4Result?.uploadedPaths.length || 0;
        const pageCount = phase6Result?.updatedPages.length || 0;
        ui.notifications.info(`Import complete: ${pageCount} pages updated from ${markdownFiles.length} files, ${assetCount} assets`);

        this.close();
    }
}
