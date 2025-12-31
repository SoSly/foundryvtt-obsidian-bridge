/**
 * YAML frontmatter extraction, prepending, and merging utilities.
 *
 * These functions handle preservation of YAML frontmatter during
 * the import/export round-trip. Frontmatter is stored as raw strings
 * to preserve exact formatting.
 */

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/;

/**
 * Extracts YAML frontmatter from markdown content.
 *
 * @param {string} content - The markdown content
 * @returns {{ frontmatter: string|null, content: string }} The extracted frontmatter and remaining content
 */
export function extractFrontmatter(content) {
    if (!content) {
        return { frontmatter: null, content: '' };
    }

    const match = content.match(FRONTMATTER_REGEX);

    if (!match) {
        return { frontmatter: null, content };
    }

    const frontmatter = match[1];
    const remainingContent = content.slice(match[0].length);

    return { frontmatter, content: remainingContent };
}

/**
 * Prepends frontmatter to a MarkdownFile's content with delimiters.
 * Mutates the markdownFile.content property.
 *
 * @param {import('../domain/MarkdownFile').default} markdownFile - The file to modify
 */
export function prependFrontmatter(markdownFile) {
    if (markdownFile.frontmatter === null) {
        return;
    }

    markdownFile.content = `---\n${markdownFile.frontmatter}\n---\n${markdownFile.content}`;
}

/**
 * Merges multiple frontmatter strings into one.
 * Uses shallow merge - first value wins on conflicts.
 *
 * @param {(string|null)[]} frontmatterStrings - Array of frontmatter strings
 * @returns {{ merged: string|null, warnings: string[] }} The merged frontmatter and any warnings
 */
export function mergeFrontmatter(frontmatterStrings) {
    const nonNull = frontmatterStrings.filter(fm => fm !== null);

    if (nonNull.length === 0) {
        return { merged: null, warnings: [] };
    }

    if (nonNull.length === 1) {
        return { merged: nonNull[0], warnings: [] };
    }

    const warnings = [];
    const parsedObjects = [];

    for (let i = 0; i < nonNull.length; i++) {
        const parsed = parseYamlLite(nonNull[i]);
        if (parsed === null) {
            warnings.push(`Could not parse frontmatter at index ${i}, falling back to first frontmatter`);
            return { merged: nonNull[0], warnings };
        }
        parsedObjects.push(parsed);
    }

    const merged = {};
    for (let i = 0; i < parsedObjects.length; i++) {
        const obj = parsedObjects[i];
        for (const key of Object.keys(obj)) {
            if (key in merged) {
                if (JSON.stringify(merged[key]) !== JSON.stringify(obj[key])) {
                    warnings.push(`Conflict on key "${key}": using value from first occurrence`);
                }
            } else {
                merged[key] = obj[key];
            }
        }
    }

    return { merged: serializeYamlLite(merged), warnings };
}

/**
 * Simple YAML parser for typical Obsidian frontmatter.
 * Handles top-level scalars, simple arrays, and one level of nesting.
 *
 * @param {string} yamlString - The YAML content without delimiters
 * @returns {object|null} The parsed object, or null on failure
 */
export function parseYamlLite(yamlString) {
    if (!yamlString || typeof yamlString !== 'string') {
        return null;
    }

    const trimmed = yamlString.trim();
    if (!trimmed) {
        return null;
    }

    try {
        const result = {};
        const lines = trimmed.split(/\r?\n/);
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            if (!line.trim()) {
                i++;
                continue;
            }

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                return null;
            }

            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();

            if (value.startsWith('[')) {
                const arrayValue = parseInlineArray(value);
                if (arrayValue === null) {
                    return null;
                }
                result[key] = arrayValue;
                i++;
            } else if (value === '' && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (nextLine.startsWith('  - ')) {
                    const arrayItems = [];
                    i++;
                    while (i < lines.length && lines[i].startsWith('  - ')) {
                        arrayItems.push(parseScalarValue(lines[i].slice(4).trim()));
                        i++;
                    }
                    result[key] = arrayItems;
                } else if (nextLine.startsWith('  ') && !nextLine.startsWith('  - ')) {
                    const nestedObj = {};
                    i++;
                    while (i < lines.length && lines[i].startsWith('  ') && !lines[i].startsWith('  - ')) {
                        const nestedLine = lines[i].slice(2);
                        const nestedColonIndex = nestedLine.indexOf(':');
                        if (nestedColonIndex !== -1) {
                            const nestedKey = nestedLine.slice(0, nestedColonIndex).trim();
                            const nestedValue = nestedLine.slice(nestedColonIndex + 1).trim();
                            nestedObj[nestedKey] = parseScalarValue(nestedValue);
                        }
                        i++;
                    }
                    result[key] = nestedObj;
                } else {
                    result[key] = '';
                    i++;
                }
            } else {
                result[key] = parseScalarValue(value);
                i++;
            }
        }

        return result;
    } catch {
        return null;
    }
}

function parseInlineArray(value) {
    if (!value.endsWith(']')) {
        return null;
    }

    const inner = value.slice(1, -1).trim();
    if (!inner) {
        return [];
    }

    const items = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < inner.length; i++) {
        const char = inner[i];

        if ((char === '"' || char === "'") && !inQuote) {
            inQuote = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuote) {
            inQuote = false;
            quoteChar = '';
        } else if (char === ',' && !inQuote) {
            items.push(parseScalarValue(current.trim()));
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        items.push(parseScalarValue(current.trim()));
    }

    return items;
}

function parseScalarValue(value) {
    if (!value) {
        return '';
    }

    if ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }

    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }

    const num = Number(value);
    if (!isNaN(num) && value !== '') {
        return num;
    }

    return value;
}

/**
 * Serializes an object to YAML string.
 *
 * @param {object} obj - The object to serialize
 * @returns {string} The YAML string
 */
export function serializeYamlLite(obj) {
    if (!obj || typeof obj !== 'object') {
        return '';
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
        return '';
    }

    const lines = [];

    for (const key of keys) {
        const value = obj[key];
        lines.push(...serializeValue(key, value, 0));
    }

    return lines.join('\n');
}

function serializeValue(key, value, indent) {
    const prefix = '  '.repeat(indent);
    const lines = [];

    if (Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        for (const item of value) {
            lines.push(`${prefix}  - ${formatScalar(item)}`);
        }
    } else if (value !== null && typeof value === 'object') {
        lines.push(`${prefix}${key}:`);
        for (const nestedKey of Object.keys(value)) {
            lines.push(...serializeValue(nestedKey, value[nestedKey], indent + 1));
        }
    } else {
        lines.push(`${prefix}${key}: ${formatScalar(value)}`);
    }

    return lines;
}

function formatScalar(value) {
    if (typeof value === 'string' && value.includes(':')) {
        return `"${value}"`;
    }
    return String(value);
}
