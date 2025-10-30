import ImportOptions from '../../domain/ImportOptions.js';
import { buildFileTree } from '../../usecase/import/buildFileTree.js';
import { collectSelectedPaths } from '../../usecase/import/collectSelectedPaths.js';
import { filterFilesBySelection } from '../../usecase/import/filterFilesBySelection.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ImportDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.importOptions = new ImportOptions();
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

        const annotatedTree = this._annotateTreeWithChars(this.importOptions.vaultFileTree, true, true);
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
    }

    _annotateTreeWithChars(node, isRoot = true, isLast = true) {
        if (!node) {
            return null;
        }

        const annotated = {
            ...node,
            isRoot,
            treeChar: isRoot ? '' : (isLast ? '└─ ' : '├─ ')
        };

        if (node.isDirectory && node.children) {
            const filteredChildren = node.children.filter(child => child.isDirectory || child.name.endsWith('.md'));
            annotated.children = filteredChildren.map((child, index) =>
                this._annotateTreeWithChars(child, false, index === filteredChildren.length - 1)
            );
        }

        return annotated;
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
        this._updateTreeNodeSelection(this.importOptions.vaultFileTree, path, isChecked);
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

            const node = this._findNodeByPath(this.importOptions.vaultFileTree, path);
            if (node) {
                checkbox.checked = node.isSelected;
                checkbox.indeterminate = node.isIndeterminate || false;
            }
        });
    }

    _findNodeByPath(node, targetPath) {
        if (!node) {
            return null;
        }

        if (node.path === targetPath) {
            return node;
        }

        if (node.isDirectory && node.children) {
            for (const child of node.children) {
                const found = this._findNodeByPath(child, targetPath);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    _updateTreeNodeSelection(node, targetPath, isSelected) {
        if (!node) {
            return false;
        }

        if (node.path === targetPath) {
            node.isSelected = isSelected;
            node.isIndeterminate = false;
            this._updateChildrenSelection(node, isSelected);
            return true;
        }

        if (node.isDirectory && node.children) {
            for (const child of node.children) {
                if (this._updateTreeNodeSelection(child, targetPath, isSelected)) {
                    this._updateParentSelection(node);
                    return true;
                }
            }
        }

        return false;
    }

    _updateChildrenSelection(node, isSelected) {
        if (!node.isDirectory || !node.children) {
            return;
        }

        for (const child of node.children) {
            child.isSelected = isSelected;
            child.isIndeterminate = false;
            this._updateChildrenSelection(child, isSelected);
        }
    }

    _updateParentSelection(node) {
        if (!node.isDirectory || !node.children) {
            return;
        }

        const allChildrenSelected = node.children.every(child => child.isSelected && !child.isIndeterminate);
        const someChildrenSelected = node.children.some(child => child.isSelected || child.isIndeterminate);

        if (allChildrenSelected) {
            node.isSelected = true;
            node.isIndeterminate = false;
        } else if (someChildrenSelected) {
            node.isSelected = false;
            node.isIndeterminate = true;
        } else {
            node.isSelected = false;
            node.isIndeterminate = false;
        }
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

        if (this.importOptions.vaultFileTree) {
            const selectedPaths = collectSelectedPaths(this.importOptions.vaultFileTree);
            const selectedFiles = filterFilesBySelection(this.importOptions.vaultFiles, selectedPaths);

            if (selectedFiles.length === 0) {
                ui.notifications.warn('No files selected for import');
                return;
            }

            this.importOptions.vaultFiles = selectedFiles;
        }

        ui.notifications.info('Import functionality not yet implemented');
    }
}
