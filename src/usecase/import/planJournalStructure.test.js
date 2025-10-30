import planJournalStructure from './planJournalStructure.js';
import MarkdownFile from '../../domain/MarkdownFile.js';
import ImportOptions from '../../domain/ImportOptions.js';

function createMarkdownFile(filePath) {
    return new MarkdownFile({
        filePath,
        lookupKeys: [],
        content: '<p>test</p>',
        links: [],
        assets: []
    });
}

describe('planJournalStructure', () => {
    describe('combineNotes: false', () => {
        it('should create separate journal entries for each file', () => {
            const markdownFiles = [
                createMarkdownFile('Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('Dragons/Blue Dragon.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(2);
            expect(plan.entries[0].name).toBe('Ancient Red Dragon');
            expect(plan.entries[0].pages).toHaveLength(1);
            expect(plan.entries[0].pages[0].name).toBe('Ancient Red Dragon');
            expect(plan.entries[1].name).toBe('Blue Dragon');
            expect(plan.entries[1].pages).toHaveLength(1);
        });

        it('should create folder hierarchy from file paths', () => {
            const markdownFiles = [
                createMarkdownFile('Combat/Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('Combat/Undead/Lich.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(3);

            const combatFolder = plan.folders.find(f => f.name === 'Combat');
            expect(combatFolder).toBeDefined();
            expect(combatFolder.path).toBe('Combat');
            expect(combatFolder.parentPath).toBeNull();

            const dragonsFolder = plan.folders.find(f => f.name === 'Dragons');
            expect(dragonsFolder).toBeDefined();
            expect(dragonsFolder.path).toBe('Combat/Dragons');
            expect(dragonsFolder.parentPath).toBe('Combat');

            const undeadFolder = plan.folders.find(f => f.name === 'Undead');
            expect(undeadFolder).toBeDefined();
            expect(undeadFolder.path).toBe('Combat/Undead');
            expect(undeadFolder.parentPath).toBe('Combat');
        });

        it('should place entries in correct folders', () => {
            const markdownFiles = [
                createMarkdownFile('Combat/Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('NPCs/Merchant.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries[0].folderPath).toBe('Combat/Dragons');
            expect(plan.entries[1].folderPath).toBe('NPCs');
        });

        it('should handle files at vault root', () => {
            const markdownFiles = [
                createMarkdownFile('README.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(0);
            expect(plan.entries).toHaveLength(1);
            expect(plan.entries[0].folderPath).toBeNull();
            expect(plan.entries[0].name).toBe('README');
        });
    });

    describe('combineNotes: true', () => {
        it('should combine files in same folder into one journal entry', () => {
            const markdownFiles = [
                createMarkdownFile('Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('Dragons/Blue Dragon.md'),
                createMarkdownFile('Dragons/Green Dragon.md')
            ];
            const options = new ImportOptions({
                combineNotes: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(1);
            expect(plan.entries[0].name).toBe('Dragons');
            expect(plan.entries[0].pages).toHaveLength(3);
            expect(plan.entries[0].pages[0].name).toBe('Ancient Red Dragon');
            expect(plan.entries[0].pages[1].name).toBe('Blue Dragon');
            expect(plan.entries[0].pages[2].name).toBe('Green Dragon');
        });

        it('should create separate entries for files in different folders', () => {
            const markdownFiles = [
                createMarkdownFile('Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('Undead/Lich.md')
            ];
            const options = new ImportOptions({
                combineNotes: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(2);
            expect(plan.entries[0].name).toBe('Dragons');
            expect(plan.entries[0].pages).toHaveLength(1);
            expect(plan.entries[1].name).toBe('Undead');
            expect(plan.entries[1].pages).toHaveLength(1);
        });

        it('should handle files at vault root as separate entries when combining', () => {
            const markdownFiles = [
                createMarkdownFile('README.md'),
                createMarkdownFile('CHANGELOG.md')
            ];
            const options = new ImportOptions({
                combineNotes: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(2);
            expect(plan.entries[0].folderPath).toBeNull();
            expect(plan.entries[0].name).toBe('README');
            expect(plan.entries[1].folderPath).toBeNull();
            expect(plan.entries[1].name).toBe('CHANGELOG');
        });

        it('should preserve MarkdownFile references in pages', () => {
            const dragonFile = createMarkdownFile('Dragons/Ancient Red Dragon.md');
            const markdownFiles = [dragonFile];
            const options = new ImportOptions({
                combineNotes: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries[0].pages[0].markdownFile).toBe(dragonFile);
        });
    });

    describe('skipFolderCombine: true', () => {
        it('should not combine folders that contain subfolders', () => {
            const markdownFiles = [
                createMarkdownFile('Combat/overview.md'),
                createMarkdownFile('Combat/Dragons/Ancient Red Dragon.md')
            ];
            const options = new ImportOptions({
                combineNotes: true,
                skipFolderCombine: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(2);

            const overviewEntry = plan.entries.find(e => e.name === 'overview');
            expect(overviewEntry).toBeDefined();
            expect(overviewEntry.pages).toHaveLength(1);

            const dragonsEntry = plan.entries.find(e => e.name === 'Dragons');
            expect(dragonsEntry).toBeDefined();
            expect(dragonsEntry.pages).toHaveLength(1);
        });

        it('should combine folders that do not contain subfolders', () => {
            const markdownFiles = [
                createMarkdownFile('Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('Dragons/Blue Dragon.md')
            ];
            const options = new ImportOptions({
                combineNotes: true,
                skipFolderCombine: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(1);
            expect(plan.entries[0].name).toBe('Dragons');
            expect(plan.entries[0].pages).toHaveLength(2);
        });

        it('should handle mixed scenarios correctly', () => {
            const markdownFiles = [
                createMarkdownFile('Combat/overview.md'),
                createMarkdownFile('Combat/Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('Combat/Dragons/Blue Dragon.md'),
                createMarkdownFile('NPCs/Merchant.md'),
                createMarkdownFile('NPCs/Guard.md')
            ];
            const options = new ImportOptions({
                combineNotes: true,
                skipFolderCombine: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries).toHaveLength(3);

            const overviewEntry = plan.entries.find(e => e.name === 'overview');
            expect(overviewEntry.pages).toHaveLength(1);

            const dragonsEntry = plan.entries.find(e => e.name === 'Dragons');
            expect(dragonsEntry.pages).toHaveLength(2);

            const npcsEntry = plan.entries.find(e => e.name === 'NPCs');
            expect(npcsEntry.pages).toHaveLength(2);
        });
    });

    describe('vault root handling', () => {
        it('should strip vault root from file paths', () => {
            const markdownFiles = [
                createMarkdownFile('MyVault/Combat/Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('MyVault/Combat/Undead/Lich.md'),
                createMarkdownFile('MyVault/README.md')
            ];
            const options = new ImportOptions({
                vaultPath: 'MyVault',
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(3);
            expect(plan.folders.find(f => f.name === 'Combat')).toBeDefined();
            expect(plan.folders.find(f => f.name === 'Dragons')).toBeDefined();
            expect(plan.folders.find(f => f.name === 'Undead')).toBeDefined();
            expect(plan.folders.find(f => f.name === 'MyVault')).toBeUndefined();

            expect(plan.entries).toHaveLength(3);
            const readmeEntry = plan.entries.find(e => e.name === 'README');
            expect(readmeEntry).toBeDefined();
            expect(readmeEntry.folderPath).toBeNull();

            const dragonEntry = plan.entries.find(e => e.name === 'Ancient Red Dragon');
            expect(dragonEntry).toBeDefined();
            expect(dragonEntry.folderPath).toBe('Combat/Dragons');
        });

        it('should handle vault root in combine mode', () => {
            const markdownFiles = [
                createMarkdownFile('MyVault/Dragons/Ancient Red Dragon.md'),
                createMarkdownFile('MyVault/Dragons/Blue Dragon.md')
            ];
            const options = new ImportOptions({
                vaultPath: 'MyVault',
                combineNotes: true
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(1);
            expect(plan.folders[0].name).toBe('Dragons');
            expect(plan.folders[0].path).toBe('Dragons');
            expect(plan.folders[0].parentPath).toBeNull();

            expect(plan.entries).toHaveLength(1);
            expect(plan.entries[0].name).toBe('Dragons');
            expect(plan.entries[0].folderPath).toBe('Dragons');
        });

        it('should work without vault path set', () => {
            const markdownFiles = [
                createMarkdownFile('Dragons/Ancient Red Dragon.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(1);
            expect(plan.folders[0].name).toBe('Dragons');
        });
    });

    describe('edge cases', () => {
        it('should handle empty markdown files array', () => {
            const markdownFiles = [];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(0);
            expect(plan.entries).toHaveLength(0);
        });

        it('should handle deeply nested folder structure', () => {
            const markdownFiles = [
                createMarkdownFile('A/B/C/D/file.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.folders).toHaveLength(4);
            expect(plan.folders[0].path).toBe('A');
            expect(plan.folders[1].path).toBe('A/B');
            expect(plan.folders[2].path).toBe('A/B/C');
            expect(plan.folders[3].path).toBe('A/B/C/D');
        });

        it('should strip .md extension from page names', () => {
            const markdownFiles = [
                createMarkdownFile('Dragons/Ancient Red Dragon.md')
            ];
            const options = new ImportOptions({
                combineNotes: false
            });

            const plan = planJournalStructure(markdownFiles, options);

            expect(plan.entries[0].name).toBe('Ancient Red Dragon');
            expect(plan.entries[0].pages[0].name).toBe('Ancient Red Dragon');
        });
    });
});
