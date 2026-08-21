import z from 'schemastery';
/** Cordis plugin config — host has no tunables; UI prefs live in browser localStorage. */
export declare const PluginConfig: z<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare const SETTINGS_NAMESPACE = "taffy-theme";
export declare const DEFAULT_SETTINGS: {
    schemaVersion: number;
    enabled: boolean;
    displayName: string;
    subtitle: string;
    avatar: string;
    portrait: string;
    preset: string;
    dynamicEnabled: boolean;
    dynamicIntensity: string;
    timePhaseEnabled: boolean;
    stateColorEnabled: boolean;
    motion: string;
    reducedMotion: boolean;
    veilStrength: string;
    backgroundVeil: string;
    veilOpacity: number;
    acrylicPercent: number;
    frameOpacity: number;
    panelOpacity: number;
    characterOpacity: number;
    showLeftCharacter: boolean;
    showRightCharacter: boolean;
    showMascot: boolean;
    colors: {
        preset: string;
        dynamicEnabled: boolean;
        dynamicIntensity: string;
    };
};
export declare const TaffySettingsSchema: {
    parse(value: any): any;
};
