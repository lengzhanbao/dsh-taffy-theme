import z from 'schemastery';
/** Cordis plugin config — host has no tunables; UI prefs live in browser localStorage. */
export const PluginConfig = z.object({});
export const SETTINGS_NAMESPACE = 'taffy-theme';
export const DEFAULT_SETTINGS = {
    schemaVersion: 1,
    enabled: true,
    displayName: 'Taffy',
    subtitle: 'Taffy technical assistant',
    avatar: 'default',
    portrait: 'default',
    preset: 'taffy-candy',
    dynamicEnabled: true,
    dynamicIntensity: 'standard',
    timePhaseEnabled: true,
    stateColorEnabled: true,
    motion: 'standard',
    reducedMotion: false,
    veilStrength: 'thin',
    backgroundVeil: 'thin',
    veilOpacity: 10,
    acrylicPercent: 70,
    frameOpacity: 85,
    panelOpacity: 82,
    characterOpacity: 100,
    showLeftCharacter: true,
    showRightCharacter: true,
    showMascot: true,
    colors: {
        preset: 'taffy-candy',
        dynamicEnabled: true,
        dynamicIntensity: 'standard',
    },
};
export const TaffySettingsSchema = {
    parse(value) {
        return { ...DEFAULT_SETTINGS, ...(value && typeof value === 'object' ? value : {}) };
    },
};
//# sourceMappingURL=config.js.map