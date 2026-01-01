/**
 * Converts a callout type to title case for display.
 * Replaces hyphens and underscores with spaces, capitalizes each word.
 *
 * @param {string} type - The callout type (e.g., "my-custom-type")
 * @returns {string} - Title case version (e.g., "My Custom Type")
 */
function typeToTitleCase(type) {
    return type
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Renders a single callout to HTML using the callout Handlebars partial.
 *
 * @param {import('../domain/Callout').default} callout - The callout to render
 * @param {object} showdownConverter - Showdown converter instance
 * @returns {string} - HTML string for the callout
 */
function renderCallout(callout, showdownConverter) {
    const { type, title, customTitle, foldable, defaultOpen, body } = callout;

    let displayTitle = typeToTitleCase(type);
    if (customTitle && title) {
        const titleHtml = showdownConverter.makeHtml(title);
        displayTitle = titleHtml.replace(/^<p>|<\/p>$/g, '').trim();
    }

    const template = Handlebars.partials.callout;
    return template({
        type,
        customTitle,
        foldable,
        defaultOpen,
        displayTitle,
        bodyHtml: body ? showdownConverter.makeHtml(body) : ''
    }).trim();
}

/**
 * Replaces {{CALLOUT:N}} placeholders in content with rendered callout HTML.
 *
 * @param {string} content - HTML content with callout placeholders
 * @param {import('../domain/Callout').default[]} callouts - Array of extracted callouts
 * @param {object} showdownConverter - Showdown converter instance with makeHtml method
 * @returns {string} - HTML content with callouts rendered
 */
export function replaceCalloutPlaceholders(content, callouts, showdownConverter) {
    if (!content) {
        return '';
    }

    let result = content;

    for (let i = 0; i < callouts.length; i++) {
        const placeholder = `{{CALLOUT:${i}}}`;
        const html = renderCallout(callouts[i], showdownConverter);
        result = result.replace(placeholder, html);
    }

    return result;
}
