/**
 * Updates selection state of a node in a file tree and propagates changes
 * to children and parents. Handles tri-state checkbox logic.
 *
 * @param {Object} node - Root node to search from
 * @param {string} targetPath - Path of node to update
 * @param {boolean} isSelected - New selection state
 * @returns {boolean} True if node was found and updated
 */
export function updateTreeSelection(node, targetPath, isSelected) {
    if (!node) {
        return false;
    }

    if (node.path === targetPath) {
        node.isSelected = isSelected;
        node.isIndeterminate = false;
        updateChildrenSelection(node, isSelected);
        return true;
    }

    if (node.isDirectory && node.children) {
        for (const child of node.children) {
            if (updateTreeSelection(child, targetPath, isSelected)) {
                updateParentSelection(node);
                return true;
            }
        }
    }

    return false;
}

/**
 * Updates selection state of a node in a journal tree and propagates changes
 * to children and parents. Handles tri-state checkbox logic.
 * Uses ID-based lookup for journal trees.
 *
 * @param {Object} node - Root node to search from
 * @param {string} targetId - ID of node to update
 * @param {boolean} isSelected - New selection state
 * @returns {boolean} True if node was found and updated
 */
export function updateTreeSelectionById(node, targetId, isSelected) {
    if (!node) {
        return false;
    }

    if (node.id === targetId) {
        node.isSelected = isSelected;
        node.isIndeterminate = false;
        updateChildrenSelectionById(node, isSelected);
        return true;
    }

    if (node.type === 'folder' && node.children) {
        for (const child of node.children) {
            if (updateTreeSelectionById(child, targetId, isSelected)) {
                updateParentSelectionById(node);
                return true;
            }
        }
    }

    return false;
}

/**
 * Recursively updates selection state for all children of a node.
 *
 * @param {Object} node - Parent node
 * @param {boolean} isSelected - Selection state to propagate
 */
export function updateChildrenSelection(node, isSelected) {
    if (!node.isDirectory || !node.children) {
        return;
    }

    for (const child of node.children) {
        child.isSelected = isSelected;
        child.isIndeterminate = false;
        updateChildrenSelection(child, isSelected);
    }
}

/**
 * Recursively updates selection state for all children of a journal tree node.
 *
 * @param {Object} node - Parent node
 * @param {boolean} isSelected - Selection state to propagate
 */
function updateChildrenSelectionById(node, isSelected) {
    if (node.type !== 'folder' || !node.children) {
        return;
    }

    for (const child of node.children) {
        child.isSelected = isSelected;
        child.isIndeterminate = false;
        updateChildrenSelectionById(child, isSelected);
    }
}

/**
 * Updates parent node's selection state based on children's states.
 * Implements tri-state logic: selected, unselected, or indeterminate.
 *
 * @param {Object} node - Parent node to update
 */
export function updateParentSelection(node) {
    if (!node.isDirectory || !node.children || node.children.length === 0) {
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

/**
 * Updates parent journal tree node's selection state based on children's states.
 * Implements tri-state logic: selected, unselected, or indeterminate.
 *
 * @param {Object} node - Parent node to update
 */
function updateParentSelectionById(node) {
    if (node.type !== 'folder' || !node.children || node.children.length === 0) {
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
