/**
 * Extracts Obsidian callout elements from HTML content, replacing them with placeholders.
 * Uses DOMParser to find .obsidian-callout elements and extract their data.
 *
 * @param {string} htmlContent - The HTML content to process
 * @param {object} showdownConverter - Showdown converter instance with makeMarkdown method
 * @returns {{ content: string, callouts: object[] }}
 */
export function extractCalloutsToPlaceholders(htmlContent, showdownConverter) {
    if (!htmlContent) {
        return { content: '', callouts: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const calloutElements = doc.querySelectorAll('.obsidian-callout');

    if (calloutElements.length === 0) {
        return { content: htmlContent, callouts: [] };
    }

    const callouts = [];

    calloutElements.forEach((element, index) => {
        const type = element.getAttribute('data-callout-type') || 'note';
        const customTitleAttr = element.getAttribute('data-callout-custom-title');
        const customTitle = customTitleAttr !== 'false';

        const tagName = element.tagName.toLowerCase();
        const foldable = tagName === 'details';
        const defaultOpen = foldable ? element.hasAttribute('open') : true;

        const titleElement = element.querySelector('.callout-title');
        const titleHtml = titleElement ? titleElement.innerHTML : '';
        const title = showdownConverter.makeMarkdown(titleHtml).trim();

        const contentElement = element.querySelector('.callout-content');
        const contentHtml = contentElement ? contentElement.innerHTML : '';
        const body = showdownConverter.makeMarkdown(contentHtml).trim();

        callouts.push({
            type,
            title,
            customTitle,
            foldable,
            defaultOpen,
            body
        });

        const placeholder = doc.createElement('p');
        placeholder.textContent = `{{CALLOUT:${index}}}`;
        element.parentNode.replaceChild(placeholder, element);
    });

    const resultContent = doc.body.innerHTML;

    return { content: resultContent, callouts };
}

/**
 * Restores callout placeholders in content with Obsidian callout markdown syntax.
 *
 * @param {string} content - Content with {{CALLOUT:N}} placeholders
 * @param {object[]} callouts - Array of callout data objects
 * @returns {string} - Content with placeholders replaced by Obsidian callout syntax
 */
export function restoreCalloutPlaceholders(content, callouts) {
    if (!content) {
        return '';
    }

    let result = content;

    for (let i = 0; i < callouts.length; i++) {
        const callout = callouts[i];
        const placeholder = `{{CALLOUT:${i}}}`;
        const markdown = buildCalloutMarkdown(callout);
        result = result.replace(placeholder, markdown);
    }

    return result;
}

/**
 * Builds Obsidian callout markdown syntax from callout data.
 *
 * @param {object} callout - Callout data object
 * @returns {string} - Obsidian callout markdown
 */
function buildCalloutMarkdown(callout) {
    const { type, title, customTitle, foldable, defaultOpen, body } = callout;

    let modifier = '';
    if (foldable) {
        modifier = defaultOpen ? '+' : '-';
    }

    let header = `> [!${type}]${modifier}`;
    if (customTitle && title) {
        header += ` ${title}`;
    }

    if (!body) {
        return header;
    }

    const bodyLines = body.split('\n').map(line => `> ${line}`).join('\n');

    return `${header}\n${bodyLines}`;
}
