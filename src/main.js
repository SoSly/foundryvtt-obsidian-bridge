import { registerImportHooks } from './infrastructure/registerHooks.js';

Hooks.once('init', async () => {
    console.log('Obsidian Bridge | Initializing');
    await registerImportHooks();
});
