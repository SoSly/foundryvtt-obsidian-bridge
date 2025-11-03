/**
 * Finds a node in a file tree by its path.
 * Recursively searches through the tree structure.
 *
 * @param {Object} node - Root node to search from
 * @param {string} targetPath - Path to find
 * @returns {Object|null} The found node or null
 */
export function findNodeByPath(node, targetPath) {
    if (!node) {
        return null;
    }

    if (node.path === targetPath) {
        return node;
    }

    if (node.isDirectory && node.children) {
        for (const child of node.children) {
            const found = findNodeByPath(child, targetPath);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

/**
 * Finds a node in a journal tree by its ID.
 * Recursively searches through the tree structure.
 *
 * @param {Object} node - Root node to search from
 * @param {string} targetId - ID to find
 * @returns {Object|null} The found node or null
 */
export function findNodeById(node, targetId) {
    if (!node) {
        return null;
    }

    if (node.id === targetId) {
        return node;
    }

    if (node.type === 'folder' && node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, targetId);
            if (found) {
                return found;
            }
        }
    }

    return null;
}
