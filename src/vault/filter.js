export function filterFilesBySelection(fileList, selectedPaths) {
    const result = [];

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i] || fileList.item(i);
        if (!file) {
            continue;
        }

        const parts = file.webkitRelativePath.split('/');
        const relativePath = parts.slice(1).join('/');

        if (!selectedPaths.has(relativePath)) {
            continue;
        }

        result.push(file);
    }

    return result;
}
