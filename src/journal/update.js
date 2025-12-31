/**
 * Update journal page content in Foundry
 *
 * Dependencies: Foundry (fromUuidSync, page.update APIs)
 */

export async function updateContent(markdownFiles) {
    if (!Array.isArray(markdownFiles) || markdownFiles.length === 0) {
        return { updatedPages: [] };
    }

    const updatedPages = [];

    for (const markdownFile of markdownFiles) {
        if (!markdownFile.foundryPageUuid) {
            console.warn(`Skipping file without UUID: ${markdownFile.filePath}`);
            continue;
        }

        const page = fromUuidSync(markdownFile.foundryPageUuid);

        if (!page) {
            throw new Error(`Page not found for UUID: ${markdownFile.foundryPageUuid} (${markdownFile.filePath})`);
        }

        const originalContent = page.text?.content || '';
        const originalFrontmatter = page.flags?.['obsidian-bridge']?.frontmatter ?? null;

        await page.update({
            'text.content': markdownFile.content,
            'flags.obsidian-bridge.frontmatter': markdownFile.frontmatter
        });

        updatedPages.push({
            page,
            originalContent,
            originalFrontmatter
        });
    }

    return { updatedPages };
}

export async function rollbackUpdates(updatedPages) {
    if (!Array.isArray(updatedPages) || updatedPages.length === 0) {
        return;
    }

    const reversedPages = [...updatedPages].reverse();

    for (const { page, originalContent, originalFrontmatter } of reversedPages) {
        try {
            await page.update({
                'text.content': originalContent,
                'flags.obsidian-bridge.frontmatter': originalFrontmatter
            });
        } catch (error) {
            console.error(`Failed to rollback page ${page.uuid}:`, error);
        }
    }
}
