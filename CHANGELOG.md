# Obsidian Bridge

## [Unreleased](https://github.com/SoSly/foundryvtt-obsidian-bridge)

### Added
- Obsidian callout blocks now convert to styled callouts in Foundry and back
- ZIP download fallback for browsers without File System Access API (Firefox, Safari, remote connections)
- "Strict line breaks" import option to preserve single line breaks through round-trips

### Fixed
- YAML frontmatter is now preserved during import/export instead of being corrupted
- Nested folder structures export correctly instead of flattening to a single level
- Non-journal UUID references (Actors, Scenes, Items) no longer corrupt during round-trips
- Empty HTML comments no longer litter exported markdown files

## [1.0.2] - 2025-11-19

### Fixed
- Fix `getTemplate` backwards compatibility between Foundry v12 and v13+

## [1.0.1] - 2025-11-19

### Changed
- Add explicit imports for Foundry's `getTemplate` function instead of relying on global scope

## [1.0.0] - 2025-11-04

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
- Export to Obsidian button in Journal Directory sidebar
- Export dialog with journal tree selector, merge options, and asset export settings
- Export Foundry journals to Obsidian-compatible markdown files
- Convert Foundry HTML content to markdown with proper heading, list, and formatting preservation
- Convert Foundry UUIDs back to Obsidian `[[wikilink]]` syntax
- Export referenced assets (images, PDFs, etc.) from Foundry data directory to vault
- Support for direct filesystem writes using File System Access API or ZIP download fallback
- Configurable asset path prefix for organizing exported assets in vault structure
- Progress modal showing completion percentage and current phase during import/export operations
- Pre-selected export directory matching the structure of the journal being exported
- Compatibility with Foundry VTT v12, v13, and v14
