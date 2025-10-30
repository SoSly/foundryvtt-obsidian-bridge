import VaultTreeNode from '../../domain/VaultTreeNode.js';

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

    markDirectoriesWithMarkdown(root);
    pruneDirectoriesWithoutMarkdown(root);

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

function markDirectoriesWithMarkdown(node) {
    if (!node.isDirectory) {
        return node.name.endsWith('.md');
    }

    let hasMarkdown = false;
    for (const child of node.children) {
        if (markDirectoriesWithMarkdown(child)) {
            hasMarkdown = true;
        }
    }

    node._hasMarkdown = hasMarkdown;
    return hasMarkdown;
}

function pruneDirectoriesWithoutMarkdown(node) {
    if (!node.isDirectory) {
        return;
    }

    node.children = node.children.filter(child => {
        if (!child.isDirectory) {
            return true;
        }

        if (!child._hasMarkdown) {
            return false;
        }

        pruneDirectoriesWithoutMarkdown(child);
        return true;
    });

    for (const child of node.children) {
        delete child._hasMarkdown;
    }
}
