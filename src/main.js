import { registerImportHooks } from './import/registerHooks.js';

Hooks.once('init', () => {
    console.log('Obsidian Bridge | Initializing');
    registerImportHooks();
});
