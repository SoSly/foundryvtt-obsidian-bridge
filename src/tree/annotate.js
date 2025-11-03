/**
 * Annotates a file tree with display metadata for UI rendering.
 * Adds tree characters (├─, └─) and filters to show only directories and markdown files.
 *
 * @param {Object} node - Tree node to annotate
 * @param {boolean} isRoot - Whether this is the root node
 * @param {boolean} isLast - Whether this is the last child in its parent's children array
 * @returns {Object|null} Annotated tree node with display properties
 */
export function annotateTreeForDisplay(node, isRoot = true, isLast = true) {
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
            annotateTreeForDisplay(child, false, index === filteredChildren.length - 1)
        );
    }

    return annotated;
}

/**
 * Annotates a journal tree with display metadata for UI rendering.
 * Adds tree characters (├─, └─) for visual hierarchy.
 *
 * @param {Object} node - Tree node to annotate
 * @param {boolean} isRoot - Whether this is the root node
 * @param {boolean} isLast - Whether this is the last child in its parent's children array
 * @returns {Object|null} Annotated tree node with display properties
 */
export function annotateJournalTreeForDisplay(node, isRoot = true, isLast = true) {
    if (!node) {
        return null;
    }

    const annotated = {
        ...node,
        isRoot,
        treeChar: isRoot ? '' : (isLast ? '└─ ' : '├─ ')
    };

    if (node.type === 'folder' && node.children) {
        annotated.children = node.children.map((child, index) =>
            annotateJournalTreeForDisplay(child, false, index === node.children.length - 1)
        );
    }

    return annotated;
}
