# Obsidian Bridge

A FoundryVTT module for bidirectional synchronization between Obsidian MD vaults and Foundry journal entries.

## Features

### Import
- Import Obsidian MD vaults into Foundry journal entries
- Preserve folder structure
- Convert Obsidian links to Foundry UUIDs
- Convert callout blocks to styled callouts
- Properly editable journals after import
- Overwrite existing journals on re-import

### Export
- Export Foundry journals back to Obsidian format
- Reconstruct folder structure
- Convert Foundry UUIDs back to Obsidian `[[links]]`
- Convert styled callouts back to callout blocks
- Overwrite existing files in vault

## Compatibility

| Obsidian Bridge Version | Foundry Version |
| -- | -- |
| v1.* | v12-v14 |

## Installation

Install via the Foundry module browser, or manually using this manifest URL:

```
https://github.com/SoSly/foundryvtt-obsidian-bridge/bundle/module.json
```

## Usage

### Importing from Obsidian

1. Under the Journal tab, click the "Import from Obsidian" button
2. Select your vault folder or a subfolder within it
3. Configure import options
4. Click Import

### Exporting to Obsidian

1. Under the Journal tab, click the "Export to Obsidian" button
2. Select which journals to export
3. Choose export location
4. Click Export

## Known Issues

- Folder depth is limited to Foundry's folder depth limit
- Not all Obsidian markdown features are supported in Foundry
  - Code blocks work but without syntax highlighting
  - Embeds are linked but not embedded
  - Math/LaTeX is not supported

## License

Obsidian Bridge is released under the MIT License.

## Contact

The best place to track bugs is to create a [new issue](https://github.com/nivthefox/obsidian-bridge/issues/new).
