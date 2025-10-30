export default async function rollbackPageUpdates(updatedPages) {
    if (!Array.isArray(updatedPages) || updatedPages.length === 0) {
        return;
    }

    const reversedPages = [...updatedPages].reverse();

    for (const { page, originalContent } of reversedPages) {
        try {
            await page.update({
                'text.content': originalContent
            });
        } catch (error) {
            console.error(`Failed to rollback page ${page.uuid}:`, error);
        }
    }
}
