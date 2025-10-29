import { registerImportHooks } from './interface/import/registerHooks.js';

Hooks.once('init', () => {
    console.log('Obsidian Bridge | Initializing');
    registerImportHooks();
});
