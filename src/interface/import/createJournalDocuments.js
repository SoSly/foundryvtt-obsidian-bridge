/**
 * Creates or retrieves all Foundry documents (folders, entries, pages) needed for import.
 * Mutates MarkdownFile objects to set foundryPageUuid.
 * Implements fail-fast with rollback of newly created documents.
 *
 * @param {JournalStructurePlan} plan - The planned journal structure
 * @param {MarkdownFile[]} markdownFiles - Array of markdown files (will be mutated)
 * @returns {Promise<{createdFolders: Folder[], createdEntries: JournalEntry[], createdPages: Array}>}
 * @throws {Error} If any document creation fails
 */
export async function createJournalDocuments(plan, markdownFiles) {
    const createdFolders = [];
    const createdEntries = [];
    const createdPages = [];

    try {
        const folderMap = await createFolders(plan.folders, createdFolders);
        const entryMap = await createEntries(plan.entries, folderMap, createdEntries);
        await createPages(plan.entries, entryMap, createdPages);
    } catch (error) {
        await rollbackJournalDocuments(createdPages, createdEntries, createdFolders);
        throw error;
    }

    return { createdFolders, createdEntries, createdPages };
}

async function createFolders(folders, createdFolders) {
    const folderMap = new Map();

    for (const folderPlan of folders) {
        const parentId = folderPlan.parentPath ? folderMap.get(folderPlan.parentPath)?.folder.id : null;

        const existing = game.folders.find(f => {
            if (f.type !== 'JournalEntry') {
                return false;
            }
            if (f.name !== folderPlan.name) {
                return false;
            }
            const folderId = f.folder?.id ?? null;
            return folderId === parentId;
        });

        if (existing) {
            folderMap.set(folderPlan.path, { folder: existing, isNew: false });
            continue;
        }

        const folder = await Folder.create({
            name: folderPlan.name,
            type: 'JournalEntry',
            folder: parentId
        });

        if (!folder) {
            throw new Error(`Failed to create folder: ${folderPlan.name}`);
        }

        createdFolders.push(folder);
        folderMap.set(folderPlan.path, { folder, isNew: true });
    }

    return folderMap;
}

async function createEntries(entries, folderMap, createdEntries) {
    const entryMap = new Map();

    for (const entryPlan of entries) {
        const folderId = entryPlan.folderPath ? folderMap.get(entryPlan.folderPath)?.folder.id : null;

        const existing = game.journal.find(j => {
            if (j.name !== entryPlan.name) {
                return false;
            }
            const entryFolderId = j.folder?.id ?? null;
            return entryFolderId === folderId;
        });

        if (existing) {
            entryMap.set(entryPlan, { entry: existing, isNew: false });
            continue;
        }

        const entry = await JournalEntry.create({
            name: entryPlan.name,
            folder: folderId
        });

        if (!entry) {
            throw new Error(`Failed to create journal entry: ${entryPlan.name}`);
        }

        createdEntries.push(entry);
        entryMap.set(entryPlan, { entry, isNew: true });
    }

    return entryMap;
}

async function createPages(entries, entryMap, createdPages) {
    for (const entryPlan of entries) {
        const { entry } = entryMap.get(entryPlan);

        for (const pagePlan of entryPlan.pages) {
            const existing = entry.pages.find(p => p.name === pagePlan.name);

            if (existing) {
                pagePlan.markdownFile.foundryPageUuid = existing.uuid;
                continue;
            }

            const pages = await entry.createEmbeddedDocuments('JournalEntryPage', [{
                name: pagePlan.name,
                type: 'text',
                text: { content: '' }
            }]);

            if (!pages || pages.length === 0) {
                throw new Error(`Failed to create page: ${pagePlan.name} in ${entryPlan.name}`);
            }

            const page = pages[0];
            createdPages.push({ entry, page });
            pagePlan.markdownFile.foundryPageUuid = page.uuid;
        }
    }
}

/**
 * Rolls back created journal documents in reverse order.
 *
 * @param {Array} createdPages - Array of {entry, page} objects to delete
 * @param {JournalEntry[]} createdEntries - Array of journal entries to delete
 * @param {Folder[]} createdFolders - Array of folders to delete
 */
export async function rollbackJournalDocuments(createdPages, createdEntries, createdFolders) {
    for (const { entry, page } of createdPages.reverse()) {
        try {
            await entry.deleteEmbeddedDocuments('JournalEntryPage', [page.id]);
        } catch (error) {
            console.error(`Failed to rollback page ${page.name}:`, error);
        }
    }

    for (const entry of createdEntries.reverse()) {
        try {
            await entry.delete();
        } catch (error) {
            console.error(`Failed to rollback entry ${entry.name}:`, error);
        }
    }

    for (const folder of createdFolders.reverse()) {
        try {
            await folder.delete();
        } catch (error) {
            console.error(`Failed to rollback folder ${folder.name}:`, error);
        }
    }
}
