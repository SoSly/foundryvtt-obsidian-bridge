export default async function updatePageContent(markdownFiles) {
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

        await page.update({
            'text.content': markdownFile.htmlContent
        });

        updatedPages.push({
            page,
            originalContent
        });
    }

    return { updatedPages };
}
