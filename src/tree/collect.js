function traverse(node, selectedPaths) {
    if (!node) {
        return;
    }

    if (!node.isDirectory && node.isSelected) {
        selectedPaths.add(node.path);
    }

    if (node.isDirectory && node.children) {
        for (const child of node.children) {
            traverse(child, selectedPaths);
        }
    }
}

export function collectSelectedPaths(tree) {
    if (!tree) {
        return new Set();
    }

    const selectedPaths = new Set();
    traverse(tree, selectedPaths);
    return selectedPaths;
}

/**
 * Collects all selected journal documents from a journal tree.
 * Recursively traverses the tree and collects journal nodes that are selected.
 *
 * @param {Object} node - Root node to collect from
 * @returns {Object[]} Array of journal documents
 */
export function collectSelectedJournals(node) {
    if (!node) {
        return [];
    }

    const journals = [];

    if (node.type === 'journal' && node.isSelected && node.document) {
        journals.push(node.document);
    }

    if (node.type === 'folder' && node.children) {
        for (const child of node.children) {
            journals.push(...collectSelectedJournals(child));
        }
    }

    return journals;
}
