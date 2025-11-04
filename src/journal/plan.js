import JournalStructurePlan from '../domain/JournalStructurePlan.js';

export default function planJournalStructure(markdownFiles, options) {
    if (!markdownFiles || !Array.isArray(markdownFiles)) {
        throw new Error('markdownFiles must be an array');
    }
    if (!options) {
        throw new Error('options is required');
    }

    const context = {
        vaultRoot: options.vaultPath ? `${options.vaultPath}/` : '',
        files: markdownFiles
    };

    const entries = buildJournalEntries(context, options);
    const folders = buildFolderHierarchy(context, entries, options);

    return new JournalStructurePlan({ folders, entries });
}

function getRelativePath(context, file) {
    if (!context.vaultRoot) {
        return file.filePath;
    }
    if (file.filePath.startsWith(context.vaultRoot)) {
        return file.filePath.slice(context.vaultRoot.length);
    }
    return file.filePath;
}

function buildFolderHierarchy(context, entries, options) {
    const folderPaths = new Set();

    for (const file of context.files) {
        const relativePath = getRelativePath(context, file);
        const pathParts = relativePath.split('/');
        pathParts.pop();

        for (let i = 0; i < pathParts.length; i++) {
            const folderPath = pathParts.slice(0, i + 1).join('/');
            folderPaths.add(folderPath);
        }
    }

    const replacedFolders = new Set();
    if (options.combineNotes) {
        for (const entry of entries) {
            if (entry.pages.length > 1) {
                const entryFolder = entry.folderPath ? `${entry.folderPath}/${entry.name}` : entry.name;
                replacedFolders.add(entryFolder);
            }
        }
    }

    const folders = [];
    for (const path of folderPaths) {
        if (replacedFolders.has(path)) {
            continue;
        }

        const parts = path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;

        folders.push({ name, path, parentPath });
    }

    return folders;
}

function buildJournalEntries(context, options) {
    if (!options.combineNotes) {
        return buildSeparateEntries(context);
    }

    if (options.skipFolderCombine) {
        return buildEntriesWithSkipFolderCombine(context);
    }

    return buildCombinedEntries(context);
}

function buildSeparateEntries(context) {
    const entries = [];

    for (const file of context.files) {
        const relativePath = getRelativePath(context, file);
        const name = getFileBasename(relativePath);
        const folderPath = getFolderPath(relativePath);

        entries.push({
            name,
            folderPath,
            pages: [{
                name,
                markdownFile: file
            }]
        });
    }

    return entries;
}

function buildCombinedEntries(context) {
    const filesByFolder = groupFilesByFolder(context);
    const foldersWithSubfolders = findFoldersWithSubfolders(context);
    const entries = [];

    for (const [folderPath, files] of Object.entries(filesByFolder)) {
        if (folderPath === '') {
            for (const file of files) {
                const relativePath = getRelativePath(context, file);
                const name = getFileBasename(relativePath);
                entries.push({
                    name,
                    folderPath: null,
                    pages: [{
                        name,
                        markdownFile: file
                    }]
                });
            }
        } else if (files.length === 1) {
            const file = files[0];
            const relativePath = getRelativePath(context, file);
            const name = getFileBasename(relativePath);
            entries.push({
                name,
                folderPath,
                pages: [{
                    name,
                    markdownFile: file
                }]
            });
        } else {
            const folderName = folderPath.split('/').pop();
            const hasSubfolders = foldersWithSubfolders.has(folderPath);
            entries.push({
                name: folderName,
                folderPath: hasSubfolders ? folderPath : getParentPath(folderPath),
                pages: files.map(file => {
                    const relativePath = getRelativePath(context, file);
                    return {
                        name: getFileBasename(relativePath),
                        markdownFile: file
                    };
                })
            });
        }
    }

    return entries;
}

function buildEntriesWithSkipFolderCombine(context) {
    const foldersWithSubfolders = findFoldersWithSubfolders(context);
    const filesByFolder = groupFilesByFolder(context);
    const entries = [];

    for (const [folderPath, files] of Object.entries(filesByFolder)) {
        if (folderPath === '') {
            for (const file of files) {
                const relativePath = getRelativePath(context, file);
                const name = getFileBasename(relativePath);
                entries.push({
                    name,
                    folderPath: null,
                    pages: [{
                        name,
                        markdownFile: file
                    }]
                });
            }
        } else if (foldersWithSubfolders.has(folderPath) || files.length === 1) {
            for (const file of files) {
                const relativePath = getRelativePath(context, file);
                const name = getFileBasename(relativePath);
                entries.push({
                    name,
                    folderPath,
                    pages: [{
                        name,
                        markdownFile: file
                    }]
                });
            }
        } else {
            const folderName = folderPath.split('/').pop();
            entries.push({
                name: folderName,
                folderPath: getParentPath(folderPath),
                pages: files.map(file => {
                    const relativePath = getRelativePath(context, file);
                    return {
                        name: getFileBasename(relativePath),
                        markdownFile: file
                    };
                })
            });
        }
    }

    return entries;
}

function groupFilesByFolder(context) {
    const groups = {};

    for (const file of context.files) {
        const relativePath = getRelativePath(context, file);
        const folderPath = getFolderPath(relativePath) || '';

        if (!groups[folderPath]) {
            groups[folderPath] = [];
        }

        groups[folderPath].push(file);
    }

    return groups;
}

function findFoldersWithSubfolders(context) {
    const allFolders = new Set();
    const foldersWithSubfolders = new Set();

    for (const file of context.files) {
        const relativePath = getRelativePath(context, file);
        const pathParts = relativePath.split('/');
        pathParts.pop();

        for (let i = 0; i < pathParts.length; i++) {
            const folderPath = pathParts.slice(0, i + 1).join('/');
            allFolders.add(folderPath);
        }
    }

    for (const folder of allFolders) {
        for (const otherFolder of allFolders) {
            if (otherFolder !== folder && otherFolder.startsWith(`${folder}/`)) {
                foldersWithSubfolders.add(folder);
                break;
            }
        }
    }

    return foldersWithSubfolders;
}

function getFolderPath(relativePath) {
    const parts = relativePath.split('/');
    if (parts.length === 1) {
        return null;
    }
    return parts.slice(0, -1).join('/');
}

function getParentPath(folderPath) {
    if (!folderPath) {
        return null;
    }
    const parts = folderPath.split('/');
    if (parts.length === 1) {
        return null;
    }
    return parts.slice(0, -1).join('/');
}

function getFileBasename(relativePath) {
    const parts = relativePath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.md$/, '');
}
