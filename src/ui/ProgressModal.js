const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ProgressModal extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.progressState = {
            currentPhase: 0,
            phaseLabel: 'obsidian-bridge.progress.starting',
            completedPhases: 0,
            totalPhases: 0,
            percentage: 0
        };
    }

    static DEFAULT_OPTIONS = {
        id: 'obsidian-bridge-progress',
        classes: ['obsidian-bridge', 'progress-modal'],
        window: {
            frame: true,
            positioned: true,
            title: 'obsidian-bridge.progress.title',
            icon: 'fas fa-spinner',
            minimizable: false,
            resizable: false,
            controls: []
        },
        position: {
            width: 500,
            height: 'auto'
        }
    };

    static PARTS = {
        content: {
            template: 'modules/obsidian-bridge/templates/progress-modal.hbs'
        }
    };

    async _prepareContext(options) {
        return {
            phaseLabel: game.i18n.localize(this.progressState.phaseLabel),
            percentage: this.progressState.percentage,
            completedPhases: this.progressState.completedPhases,
            totalPhases: this.progressState.totalPhases,
            showItemCount: false
        };
    }

    updateProgress(state) {
        this.progressState = { ...state };
        this.render();
    }
}
