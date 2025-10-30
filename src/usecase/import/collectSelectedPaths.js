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
