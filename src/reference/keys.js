export default function generateLookupKeys(filePath) {
    if (!filePath) {
        return [];
    }

    let pathWithoutExtension = filePath;
    if (pathWithoutExtension.endsWith('.md')) {
        pathWithoutExtension = pathWithoutExtension.slice(0, -3);
    }

    const parts = pathWithoutExtension.split('/');
    const keys = [];

    for (let i = parts.length - 1; i >= 0; i--) {
        const key = parts.slice(i).join('/');
        keys.push(key);
    }

    return keys;
}
