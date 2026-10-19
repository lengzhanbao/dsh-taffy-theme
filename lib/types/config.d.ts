import z from 'schemastery';
/** Cordis plugin config — host has no tunables; UI prefs live in browser localStorage. */
export declare const PluginConfig: z<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare const SETTINGS_NAMESPACE = "taffy-theme";
export declare const TaffyColorConfigSchema: z<Schemastery.ObjectS<{
    preset: z<"taffy-candy" | "taffy-night" | "taffy-mint" | "custom", "taffy-candy" | "taffy-night" | "taffy-mint" | "custom">;
    primary: z<string, string>;
    secondary: z<string, string>;
    accent: z<string, string>;
    background: z<string, string>;
    surface: z<string, string>;
    text: z<string, string>;
    success: z<string, string>;
    warning: z<string, string>;
    error: z<string, string>;
    dynamicEnabled: z<boolean, boolean>;
    dynamicIntensity: z<"low" | "standard" | "high", "low" | "standard" | "high">;
}>, Schemastery.ObjectT<{
    preset: z<"taffy-candy" | "taffy-night" | "taffy-mint" | "custom", "taffy-candy" | "taffy-night" | "taffy-mint" | "custom">;
    primary: z<string, string>;
    secondary: z<string, string>;
    accent: z<string, string>;
    background: z<string, string>;
    surface: z<string, string>;
    text: z<string, string>;
    success: z<string, string>;
    warning: z<string, string>;
    error: z<string, string>;
    dynamicEnabled: z<boolean, boolean>;
    dynamicIntensity: z<"low" | "standard" | "high", "low" | "standard" | "high">;
}>>;
export declare const TaffySettingsSchema: z<Schemastery.ObjectS<{
    schemaVersion: z<1, 1>;
    enabled: z<boolean, boolean>;
    displayName: z<string, string>;
    subtitle: z<string, string>;
    heroHeadline: z<string, string>;
    avatar: z<string, string>;
    portrait: z<string, string>;
    timePhaseEnabled: z<boolean, boolean>;
    stateColorEnabled: z<boolean, boolean>;
    motion: z<"standard" | "off", "standard" | "off">;
    reducedMotion: z<boolean, boolean>;
    veilOpacity: z<number, number>;
    acrylicPercent: z<number, number>;
    frameOpacity: z<number, number>;
    panelOpacity: z<number, number>;
    characterOpacity: z<number, number>;
    showLeftCharacter: z<boolean, boolean>;
    showRightCharacter: z<boolean, boolean>;
    showMascot: z<boolean, boolean>;
    backgroundHero: z<string, string>;
    backgroundFunctional: z<string, string>;
    sidebarWatermark: z<string, string>;
    chibiMascot: z<string, string>;
    colors: z<Schemastery.ObjectS<{
        preset: z<"taffy-candy" | "taffy-night" | "taffy-mint" | "custom", "taffy-candy" | "taffy-night" | "taffy-mint" | "custom">;
        primary: z<string, string>;
        secondary: z<string, string>;
        accent: z<string, string>;
        background: z<string, string>;
        surface: z<string, string>;
        text: z<string, string>;
        success: z<string, string>;
        warning: z<string, string>;
        error: z<string, string>;
        dynamicEnabled: z<boolean, boolean>;
        dynamicIntensity: z<"low" | "standard" | "high", "low" | "standard" | "high">;
    }>, Schemastery.ObjectT<{
        preset: z<"taffy-candy" | "taffy-night" | "taffy-mint" | "custom", "taffy-candy" | "taffy-night" | "taffy-mint" | "custom">;
        primary: z<string, string>;
        secondary: z<string, string>;
        accent: z<string, string>;
        background: z<string, string>;
        surface: z<string, string>;
        text: z<string, string>;
        success: z<string, string>;
        warning: z<string, string>;
        error: z<string, string>;
        dynamicEnabled: z<boolean, boolean>;
        dynamicIntensity: z<"low" | "standard" | "high", "low" | "standard" | "high">;
    }>>;
}>, Schemastery.ObjectT<{
    schemaVersion: z<1, 1>;
    enabled: z<boolean, boolean>;
    displayName: z<string, string>;
    subtitle: z<string, string>;
    heroHeadline: z<string, string>;
    avatar: z<string, string>;
    portrait: z<string, string>;
    timePhaseEnabled: z<boolean, boolean>;
    stateColorEnabled: z<boolean, boolean>;
    motion: z<"standard" | "off", "standard" | "off">;
    reducedMotion: z<boolean, boolean>;
    veilOpacity: z<number, number>;
    acrylicPercent: z<number, number>;
    frameOpacity: z<number, number>;
    panelOpacity: z<number, number>;
    characterOpacity: z<number, number>;
    showLeftCharacter: z<boolean, boolean>;
    showRightCharacter: z<boolean, boolean>;
    showMascot: z<boolean, boolean>;
    backgroundHero: z<string, string>;
    backgroundFunctional: z<string, string>;
    sidebarWatermark: z<string, string>;
    chibiMascot: z<string, string>;
    colors: z<Schemastery.ObjectS<{
        preset: z<"taffy-candy" | "taffy-night" | "taffy-mint" | "custom", "taffy-candy" | "taffy-night" | "taffy-mint" | "custom">;
        primary: z<string, string>;
        secondary: z<string, string>;
        accent: z<string, string>;
        background: z<string, string>;
        surface: z<string, string>;
        text: z<string, string>;
        success: z<string, string>;
        warning: z<string, string>;
        error: z<string, string>;
        dynamicEnabled: z<boolean, boolean>;
        dynamicIntensity: z<"low" | "standard" | "high", "low" | "standard" | "high">;
    }>, Schemastery.ObjectT<{
        preset: z<"taffy-candy" | "taffy-night" | "taffy-mint" | "custom", "taffy-candy" | "taffy-night" | "taffy-mint" | "custom">;
        primary: z<string, string>;
        secondary: z<string, string>;
        accent: z<string, string>;
        background: z<string, string>;
        surface: z<string, string>;
        text: z<string, string>;
        success: z<string, string>;
        warning: z<string, string>;
        error: z<string, string>;
        dynamicEnabled: z<boolean, boolean>;
        dynamicIntensity: z<"low" | "standard" | "high", "low" | "standard" | "high">;
    }>>;
}>>;
export type TaffyColorPreset = 'taffy-candy' | 'taffy-night' | 'taffy-mint' | 'custom';
export type TaffyDynamicIntensity = 'low' | 'standard' | 'high';
export type TaffyMotion = 'off' | 'standard';
/**
 * The runtime shape of the stored settings, declared explicitly.
 *
 * Deliberately NOT `ReturnType<typeof TaffySettingsSchema>`: schemastery's
 * `SchemaOutput` admits `Volatile<T>` (its `!!js` expression wrapper), so
 * deriving the type leaked `string | Volatile<string>` into every consumer and
 * made the client sources fail a type check they were never run through.
 * `parseTaffySettings` always rebuilds a plain object, so this is the honest
 * type and the schema remains the validator.
 */
export interface TaffyColorConfig {
    preset: TaffyColorPreset;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    dynamicEnabled: boolean;
    dynamicIntensity: TaffyDynamicIntensity;
}
export interface TaffySettings {
    schemaVersion: 1;
    enabled: boolean;
    displayName: string;
    subtitle: string;
    heroHeadline: string;
    avatar: string;
    portrait: string;
    timePhaseEnabled: boolean;
    stateColorEnabled: boolean;
    motion: TaffyMotion;
    reducedMotion: boolean;
    veilOpacity: number;
    acrylicPercent: number;
    frameOpacity: number;
    panelOpacity: number;
    characterOpacity: number;
    showLeftCharacter: boolean;
    showRightCharacter: boolean;
    showMascot: boolean;
    /** `default` means the art that belongs to the active mode; otherwise an id from BUNDLED_BACKGROUNDS. */
    backgroundHero: string;
    backgroundFunctional: string;
    /** `default` = shipped watermark, `none` = no watermark layer. */
    sidebarWatermark: string;
    /** `default` = the classic mascot, otherwise an id from BUNDLED_CHIBI. */
    chibiMascot: string;
    colors: TaffyColorConfig;
}
export declare function parseTaffySettings(value: unknown): TaffySettings;
export declare const DEFAULT_SETTINGS: TaffySettings;
/** @deprecated Use parseTaffySettings — kept for older imports/tests. */
export declare const TaffySettingsSchemaParser: {
    parse: typeof parseTaffySettings;
};
