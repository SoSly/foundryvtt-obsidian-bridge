import { registerImportHooks } from './interface/import/registerHooks.js';

Hooks.once('init', async () => {
    console.log('Obsidian Bridge | Initializing');
    await registerImportHooks();
});
