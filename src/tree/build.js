import VaultTreeNode from '../domain/VaultTreeNode.js';
import JournalTreeNode from '../domain/JournalTreeNode.js';

export function buildJournalTree() {
    const root = createJournalFolderNode('root', 'Journals', null);
    const folderMap = new Map();
    folderMap.set(null, root);

    for (const folder of game.folders.values()) {
        if (folder.type !== 'JournalEntry') {
            continue;
        }

        const node = createJournalFolderNode(folder.id, folder.name, folder.folder?.id || null);
        folderMap.set(folder.id, node);
    }

    for (const [folderId, node] of folderMap) {
        if (folderId === null) {
            continue;
        }

        const folder = game.folders.get(folderId);
        const parentId = folder?.folder?.id || null;
        const parentNode = folderMap.get(parentId);

        if (parentNode) {
            parentNode.children.push(node);
        }
    }

    for (const journal of game.journal.values()) {
        const node = createJournalNode(journal.id, journal.name, journal);
        const folderId = journal.folder?.id || null;
        const parentNode = folderMap.get(folderId);

        if (parentNode) {
            parentNode.children.push(node);
        }
    }

    sortJournalTree(root);

    if (root.children.length === 0) {
        return null;
    }

    return root;
}

function createJournalFolderNode(id, name) {
    return new JournalTreeNode({
        id,
        name,
        type: 'folder',
        isSelected: true,
        children: []
    });
}

function createJournalNode(id, name, document) {
    return new JournalTreeNode({
        id,
        name,
        type: 'journal',
        isSelected: true,
        document
    });
}

function sortJournalTree(node) {
    if (node.type !== 'folder') {
        return;
    }

    node.children.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    for (const child of node.children) {
        sortJournalTree(child);
    }
}

export function buildFileTree(fileList) {
    if (!fileList || fileList.length === 0) {
        return null;
    }

    const root = createNode('', '', true);
    let vaultName = '';

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i] || fileList.item(i);
        if (!file) {
            continue;
        }

        const parts = file.webkitRelativePath.split('/');
        if (!vaultName) {
            vaultName = parts[0];
        }

        let currentNode = root;
        for (let j = 1; j < parts.length; j++) {
            const part = parts[j];
            const isLastPart = j === parts.length - 1;
            const pathSoFar = parts.slice(1, j + 1).join('/');

            if (isLastPart && !part.endsWith('.md')) {
                break;
            }

            let childNode = currentNode.children.find(c => c.name === part);
            if (!childNode) {
                childNode = createNode(part, pathSoFar, !isLastPart);
                currentNode.children.push(childNode);
            }
            currentNode = childNode;
        }
    }

    const markdownMap = new Map();
    markDirectoriesWithMarkdown(root, markdownMap);
    pruneDirectoriesWithoutMarkdown(root, markdownMap);

    if (root.children.length === 0) {
        return null;
    }

    root.name = vaultName;
    return root;
}

function createNode(name, path, isDirectory) {
    return new VaultTreeNode({
        name,
        path,
        isDirectory,
        isSelected: true,
        children: isDirectory ? [] : undefined
    });
}

function markDirectoriesWithMarkdown(node, markdownMap) {
    if (!node.isDirectory) {
        return node.name.endsWith('.md');
    }

    let hasMarkdown = false;
    for (const child of node.children) {
        if (markDirectoriesWithMarkdown(child, markdownMap)) {
            hasMarkdown = true;
        }
    }

    markdownMap.set(node, hasMarkdown);
    return hasMarkdown;
}

function pruneDirectoriesWithoutMarkdown(node, markdownMap) {
    if (!node.isDirectory) {
        return;
    }

    node.children = node.children.filter(child => {
        if (!child.isDirectory) {
            return true;
        }

        if (!markdownMap.get(child)) {
            return false;
        }

        pruneDirectoriesWithoutMarkdown(child, markdownMap);
        return true;
    });
}
