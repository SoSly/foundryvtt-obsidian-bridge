import ExportOptions from '../domain/ExportOptions.js';
import { buildJournalTree } from '../tree/build.js';
import { annotateJournalTreeForDisplay } from '../tree/annotate.js';
import { findNodeById } from '../tree/find.js';
import { collectSelectedJournals } from '../tree/collect.js';
import { updateTreeSelectionById } from './updateTreeSelection.js';
import executePipeline from '../pipeline/executePipeline.js';
import createExportPipeline from '../pipeline/exportPipeline.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ExportDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.journalTree = buildJournalTree();
        this.merge = false;
        this.exportAssets = false;
        this.assetPathPrefix = `worlds/${game.world.id}/obsidian-assets`;
    }

    static DEFAULT_OPTIONS = {
        id: 'obsidian-bridge-export',
        classes: ['obsidian-bridge', 'export-dialog'],
        tag: 'form',
        window: {
            frame: true,
            positioned: true,
            title: 'obsidian-bridge.export.dialog-title',
            icon: 'fas fa-file-export',
            minimizable: false,
            resizable: false
        },
        form: {
            handler: ExportDialog._onSubmit,
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
            template: 'modules/obsidian-bridge/templates/export-dialog.hbs'
        }
    };

    async _prepareContext(options) {
        return {
            journalTree: this.journalTree,
            merge: this.merge,
            exportAssets: this.exportAssets,
            assetPathPrefix: this.assetPathPrefix
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const mergeCheckbox = this.element.querySelector('input[name="merge"]');
        if (mergeCheckbox) {
            mergeCheckbox.addEventListener('change', async event => {
                this.merge = event.target.checked;
                await this.render();
            });
        }

        const exportAssetsCheckbox = this.element.querySelector('input[name="exportAssets"]');
        if (exportAssetsCheckbox) {
            exportAssetsCheckbox.addEventListener('change', async event => {
                this.exportAssets = event.target.checked;
                await this.render();
            });
        }

        this._renderTree();
    }

    _renderTree() {
        const treeContainer = this.element.querySelector('#journal-tree');
        if (!treeContainer || !this.journalTree) {
            return;
        }

        const annotatedTree = annotateJournalTreeForDisplay(this.journalTree, true, true);
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

        const id = treeItem.dataset.id;
        const isChecked = checkbox.checked;
        updateTreeSelectionById(this.journalTree, id, isChecked);
        this._syncCheckboxStates();
    }

    _syncCheckboxStates() {
        const treeContainer = this.element.querySelector('#journal-tree');
        if (!treeContainer) {
            return;
        }

        const allTreeItems = treeContainer.querySelectorAll('.tree-item');
        allTreeItems.forEach(item => {
            const id = item.dataset.id;
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (!checkbox) {
                return;
            }

            const node = findNodeById(this.journalTree, id);
            if (node) {
                checkbox.checked = node.isSelected;
                checkbox.indeterminate = node.isIndeterminate || false;
            }
        });
    }

    static async _onSubmit(event, form, formData) {
        const data = formData.object;

        this.merge = data.merge || false;
        this.exportAssets = data.exportAssets || false;
        this.assetPathPrefix = data.assetPathPrefix || '';

        const journals = collectSelectedJournals(this.journalTree);

        if (journals.length === 0) {
            ui.notifications.warn(game.i18n.localize('obsidian-bridge.export.no-journals-selected'));
            return;
        }

        const exportOptions = new ExportOptions({
            journals,
            merge: this.merge,
            exportAssets: this.exportAssets,
            assetPathPrefix: this.assetPathPrefix
        });

        const showdownConverter = new showdown.Converter();
        Object.entries(CONST.SHOWDOWN_OPTIONS).forEach(([k, v]) => {
            showdownConverter.setOption(k, v);
        });

        const pipeline = createExportPipeline(exportOptions, showdownConverter);
        const result = await executePipeline(pipeline);

        if (!result.success) {
            console.error('Export failed:', result.error);
            ui.notifications.error(`Export failed: ${result.error.message}`);
            return;
        }

        const writeResult = result.getPhaseResult('write-vault');
        const fileCount = writeResult?.filesWritten || 0;
        const assetCount = writeResult?.assetsWritten || 0;

        ui.notifications.info(`Export complete: ${fileCount} files, ${assetCount} assets`);

        this.close();
    }
}
