# Obsidian Bridge

## [Unreleased](https://github.com/SoSly/foundryvtt-obsidian-bridge)

### Added
- Import Obsidian Vault button in Journal Directory sidebar
- Import dialog with options for combining notes, handling subfolders, and importing assets
- Native OS folder picker for selecting local Obsidian vaults
- Collapsible file tree showing only markdown files and folders, with checkboxes for selective import
- Three-state checkboxes showing indeterminate state when some children are selected
- Conditional visibility for import options based on vault selection and checkbox states
- Import markdown files from selected Obsidian vault folders to Foundry journal entries
- Convert Obsidian `[[wikilink]]` syntax to Foundry UUIDs with support for display text and headings
- Upload and link non-markdown assets (images, PDFs, etc.) from vault to Foundry data directory
- Automatic rollback of created documents and uploaded files when import fails
- Support for three import modes: separate entries per file, combined entries per folder, or combined with skip-folder-combine option
