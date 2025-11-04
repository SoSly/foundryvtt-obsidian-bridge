# ProgressModal Usage

The ProgressModal is a standalone UI component that displays progress for long-running pipeline operations. It is not yet integrated into the Import and Export dialogs.

## Basic Usage

```javascript
import ProgressModal from './ui/ProgressModal.js';
import PipelineConfig from './domain/PipelineConfig.js';
import executePipeline from './pipeline/executePipeline.js';

// Create and render the progress modal
const progressModal = new ProgressModal();
await progressModal.render({ force: true });

// Create a pipeline with progress callback
const pipeline = new PipelineConfig({
    phases: [...],
    context: {...},
    onProgress: (state) => {
        progressModal.updateProgress(state);
    }
});

// Execute the pipeline
const result = await executePipeline(pipeline);

// Close the modal when done
await progressModal.close();
```

## Integration Example (Future)

When integrated into ImportDialog or ExportDialog, it would look like this:

```javascript
static async _onSubmit(event, form, formData) {
    // Validate form data...

    // Create progress modal
    const progressModal = new ProgressModal();
    await progressModal.render({ force: true });

    // Create pipeline with progress callback
    const pipeline = createImportPipeline(importOptions, showdownConverter);
    pipeline.onProgress = (state) => progressModal.updateProgress(state);

    // Execute pipeline
    const result = await executePipeline(pipeline);

    // Close modal
    await progressModal.close();

    // Handle result
    if (result.success) {
        ui.notifications.info('Import completed successfully');
        this.close();
    } else {
        ui.notifications.error(`Import failed: ${result.error.message}`);
    }
}
```

## Progress State

The progress callback receives a state object with:

```javascript
{
    currentPhase: 3,              // Zero-based index
    phaseLabel: 'obsidian-bridge.progress.extract-references',  // i18n key
    completedPhases: 3,           // Number completed
    totalPhases: 10,              // Total to execute
    percentage: 30                // 0-100
}
```

## Testing

To test the ProgressModal manually in FoundryVTT:

1. Open the browser console (F12)
2. Run the following code:

```javascript
// Import the modal (adjust path if needed)
const { default: ProgressModal } = await import('/modules/obsidian-bridge/dist/obsidian-bridge.js');

// Create and show modal
const modal = new ProgressModal();
await modal.render({ force: true });

// Simulate progress updates
for (let i = 0; i <= 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    modal.updateProgress({
        currentPhase: i,
        phaseLabel: `obsidian-bridge.progress.${i === 10 ? 'complete' : 'prepare-documents'}`,
        completedPhases: i,
        totalPhases: 10,
        percentage: (i / 10) * 100
    });
}

// Close after completion
await new Promise(resolve => setTimeout(resolve, 1000));
await modal.close();
```

## Styling

The progress modal uses Foundry's CSS variables and supports both light and dark themes automatically. The progress bar uses a gradient effect similar to Foundry's package installation progress.
