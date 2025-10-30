import { updateTreeSelection, updateChildrenSelection, updateParentSelection } from './updateTreeSelection';

describe('updateTreeSelection', () => {
    test('returns false when node is null', () => {
        const result = updateTreeSelection(null, 'any/path', true);

        expect(result).toBe(false);
    });

    test('updates root node selection', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: []
        };

        const result = updateTreeSelection(tree, 'root', true);

        expect(result).toBe(true);
        expect(tree.isSelected).toBe(true);
        expect(tree.isIndeterminate).toBe(false);
    });

    test('updates child node and propagates to parent', () => {
        const child = {
            path: 'root/child',
            name: 'child',
            isDirectory: false,
            isSelected: false,
            isIndeterminate: false
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [child]
        };

        updateTreeSelection(tree, 'root/child', true);

        expect(child.isSelected).toBe(true);
        expect(tree.isSelected).toBe(true);
        expect(tree.isIndeterminate).toBe(false);
    });

    test('propagates selection to all children', () => {
        const child1 = { path: 'root/child1', name: 'child1', isDirectory: false, isSelected: false, isIndeterminate: false };
        const child2 = { path: 'root/child2', name: 'child2', isDirectory: false, isSelected: false, isIndeterminate: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [child1, child2]
        };

        updateTreeSelection(tree, 'root', true);

        expect(tree.isSelected).toBe(true);
        expect(child1.isSelected).toBe(true);
        expect(child2.isSelected).toBe(true);
    });

    test('clears indeterminate state when selecting node', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: true,
            children: []
        };

        updateTreeSelection(tree, 'root', true);

        expect(tree.isIndeterminate).toBe(false);
    });

    test('returns false when target path not found', () => {
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            children: []
        };

        const result = updateTreeSelection(tree, 'nonexistent', true);

        expect(result).toBe(false);
    });
});

describe('updateChildrenSelection', () => {
    test('does nothing when node is not a directory', () => {
        const fileNode = {
            path: 'file.md',
            name: 'file.md',
            isDirectory: false,
            isSelected: false
        };

        updateChildrenSelection(fileNode, true);

        expect(fileNode.isSelected).toBe(false);
    });

    test('does nothing when node has no children', () => {
        const emptyDir = {
            path: 'dir',
            name: 'dir',
            isDirectory: true,
            isSelected: false,
            children: []
        };

        updateChildrenSelection(emptyDir, true);

        expect(emptyDir.children.length).toBe(0);
    });

    test('updates all direct children', () => {
        const child1 = { path: 'root/c1', name: 'c1', isDirectory: false, isSelected: false, isIndeterminate: false };
        const child2 = { path: 'root/c2', name: 'c2', isDirectory: false, isSelected: false, isIndeterminate: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            children: [child1, child2]
        };

        updateChildrenSelection(tree, true);

        expect(child1.isSelected).toBe(true);
        expect(child1.isIndeterminate).toBe(false);
        expect(child2.isSelected).toBe(true);
        expect(child2.isIndeterminate).toBe(false);
    });

    test('recursively updates nested children', () => {
        const deepChild = { path: 'root/mid/deep', name: 'deep', isDirectory: false, isSelected: false, isIndeterminate: false };
        const midChild = {
            path: 'root/mid',
            name: 'mid',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [deepChild]
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            children: [midChild]
        };

        updateChildrenSelection(tree, true);

        expect(midChild.isSelected).toBe(true);
        expect(deepChild.isSelected).toBe(true);
    });

    test('clears indeterminate state for all children', () => {
        const child = {
            path: 'root/child',
            name: 'child',
            isDirectory: false,
            isSelected: false,
            isIndeterminate: true
        };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            children: [child]
        };

        updateChildrenSelection(tree, false);

        expect(child.isIndeterminate).toBe(false);
    });
});

describe('updateParentSelection', () => {
    test('does nothing when node is not a directory', () => {
        const fileNode = {
            path: 'file.md',
            name: 'file.md',
            isDirectory: false,
            isSelected: false,
            isIndeterminate: false
        };

        updateParentSelection(fileNode);

        expect(fileNode.isSelected).toBe(false);
        expect(fileNode.isIndeterminate).toBe(false);
    });

    test('does nothing when node has no children', () => {
        const emptyDir = {
            path: 'dir',
            name: 'dir',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: []
        };

        updateParentSelection(emptyDir);

        expect(emptyDir.isSelected).toBe(false);
    });

    test('sets selected when all children are selected', () => {
        const child1 = { path: 'root/c1', name: 'c1', isDirectory: false, isSelected: true, isIndeterminate: false };
        const child2 = { path: 'root/c2', name: 'c2', isDirectory: false, isSelected: true, isIndeterminate: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [child1, child2]
        };

        updateParentSelection(tree);

        expect(tree.isSelected).toBe(true);
        expect(tree.isIndeterminate).toBe(false);
    });

    test('sets indeterminate when some children are selected', () => {
        const child1 = { path: 'root/c1', name: 'c1', isDirectory: false, isSelected: true, isIndeterminate: false };
        const child2 = { path: 'root/c2', name: 'c2', isDirectory: false, isSelected: false, isIndeterminate: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [child1, child2]
        };

        updateParentSelection(tree);

        expect(tree.isSelected).toBe(false);
        expect(tree.isIndeterminate).toBe(true);
    });

    test('sets unselected when no children are selected', () => {
        const child1 = { path: 'root/c1', name: 'c1', isDirectory: false, isSelected: false, isIndeterminate: false };
        const child2 = { path: 'root/c2', name: 'c2', isDirectory: false, isSelected: false, isIndeterminate: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: true,
            isIndeterminate: false,
            children: [child1, child2]
        };

        updateParentSelection(tree);

        expect(tree.isSelected).toBe(false);
        expect(tree.isIndeterminate).toBe(false);
    });

    test('treats indeterminate child as partially selected', () => {
        const child1 = { path: 'root/c1', name: 'c1', isDirectory: false, isSelected: false, isIndeterminate: true };
        const child2 = { path: 'root/c2', name: 'c2', isDirectory: false, isSelected: false, isIndeterminate: false };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [child1, child2]
        };

        updateParentSelection(tree);

        expect(tree.isSelected).toBe(false);
        expect(tree.isIndeterminate).toBe(true);
    });

    test('requires all children fully selected for parent to be selected', () => {
        const child1 = { path: 'root/c1', name: 'c1', isDirectory: false, isSelected: true, isIndeterminate: false };
        const child2 = { path: 'root/c2', name: 'c2', isDirectory: false, isSelected: true, isIndeterminate: true };
        const tree = {
            path: 'root',
            name: 'root',
            isDirectory: true,
            isSelected: false,
            isIndeterminate: false,
            children: [child1, child2]
        };

        updateParentSelection(tree);

        expect(tree.isSelected).toBe(false);
        expect(tree.isIndeterminate).toBe(true);
    });
});
