import generateLookupKeys from '../../../src/usecase/import/generateLookupKeys.js';

describe('generateLookupKeys', () => {
    it('should generate lookup keys for a deeply nested file', () => {
        const result = generateLookupKeys('Combat/Dragons/Ancient Red Dragon.md');
        expect(result).toEqual([
            'Ancient Red Dragon',
            'Dragons/Ancient Red Dragon',
            'Combat/Dragons/Ancient Red Dragon'
        ]);
    });

    it('should generate lookup keys for a single-level file', () => {
        const result = generateLookupKeys('Ancient Red Dragon.md');
        expect(result).toEqual(['Ancient Red Dragon']);
    });

    it('should generate lookup keys for a two-level file', () => {
        const result = generateLookupKeys('Dragons/Ancient Red Dragon.md');
        expect(result).toEqual([
            'Ancient Red Dragon',
            'Dragons/Ancient Red Dragon'
        ]);
    });

    it('should handle files without .md extension', () => {
        const result = generateLookupKeys('Combat/Dragons/Ancient Red Dragon');
        expect(result).toEqual([
            'Ancient Red Dragon',
            'Dragons/Ancient Red Dragon',
            'Combat/Dragons/Ancient Red Dragon'
        ]);
    });

    it('should return empty array for empty string', () => {
        const result = generateLookupKeys('');
        expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
        const result = generateLookupKeys(null);
        expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
        const result = generateLookupKeys(undefined);
        expect(result).toEqual([]);
    });

    it('should handle files with spaces in names', () => {
        const result = generateLookupKeys('My Folder/My Subfolder/My File Name.md');
        expect(result).toEqual([
            'My File Name',
            'My Subfolder/My File Name',
            'My Folder/My Subfolder/My File Name'
        ]);
    });

    it('should handle files with special characters', () => {
        const result = generateLookupKeys('NPCs/Bob\'s Tavern.md');
        expect(result).toEqual([
            'Bob\'s Tavern',
            'NPCs/Bob\'s Tavern'
        ]);
    });
});
