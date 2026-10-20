import z from 'schemastery';
/** Cordis plugin config — host has no tunables; UI prefs live in browser localStorage. */
export declare const PluginConfig: z<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare const SETTINGS_NAMESPACE = "taffy-theme";
export declare const DEFAULT_SIDEBAR_WATERMARK_STRENGTH = 60;
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
    sidebarWatermarkStrength: z<number, number>;
    chibiMascot: z<string, string>;
    sidebarDecoration: z<"off" | "simple" | "full", "off" | "simple" | "full">;
    userBubbleStyle: z<string, string>;
    userBubbleOpacity: z<number, number>;
    userBubbleRadius: z<number, number>;
    userBubbleMaxWidth: z<number, number>;
    userBubbleBorder: z<string, string>;
    composerStyle: z<string, string>;
    composerDecoration: z<string, string>;
    composerOpacity: z<number, number>;
    composerRadius: z<number, number>;
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
    sidebarWatermarkStrength: z<number, number>;
    chibiMascot: z<string, string>;
    sidebarDecoration: z<"off" | "simple" | "full", "off" | "simple" | "full">;
    userBubbleStyle: z<string, string>;
    userBubbleOpacity: z<number, number>;
    userBubbleRadius: z<number, number>;
    userBubbleMaxWidth: z<number, number>;
    userBubbleBorder: z<string, string>;
    composerStyle: z<string, string>;
    composerDecoration: z<string, string>;
    composerOpacity: z<number, number>;
    composerRadius: z<number, number>;
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
export type TaffySidebarDecoration = 'off' | 'simple' | 'full';
export type TaffyBubbleStyle = 'native' | 'glass' | 'ornate';
export type TaffyBubbleBorder = 'off' | 'subtle' | 'accent';
export type TaffyComposerStyle = 'native' | 'glass' | 'ornate';
export type TaffyComposerDecoration = 'off' | 'low' | 'full';
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
    /** 0 hides the selected watermark; 100 is the strongest permitted image layer. */
    sidebarWatermarkStrength: number;
    /** `default` = the classic mascot, otherwise an id from BUNDLED_CHIBI. */
    chibiMascot: string;
    /**
     * `simple` keeps the ornaments but never touches native control geometry.
     * `full` opts into the ornate restyle of the sidebar's own buttons (the
     * 56px brand chip, the 40px rail toggle…). `off` drops the whole sidebar
     * decoration layer.
     */
    sidebarDecoration: TaffySidebarDecoration;
    /** native | glass | ornate — how the user's own messages are drawn. */
    userBubbleStyle: TaffyBubbleStyle;
    /** Background opacity percent; applied through the bubble colour token, never element opacity. */
    userBubbleOpacity: number;
    userBubbleRadius: number;
    userBubbleMaxWidth: number;
    /** off | subtle | accent */
    userBubbleBorder: TaffyBubbleBorder;
    /** native | glass | ornate */
    composerStyle: TaffyComposerStyle;
    /** off | low | full — how much filigree the composer draws. */
    composerDecoration: TaffyComposerDecoration;
    composerOpacity: number;
    composerRadius: number;
    colors: TaffyColorConfig;
}
/**
 * A stored config that predates the chat-look settings is an *existing* install:
 * it must come out of the upgrade looking exactly as it did. A config that
 * already carries these keys (or an empty config, i.e. a fresh install) gets the
 * intended new defaults.
 *
 * Numbers and enums are not part of this decision — only the string-style fields,
 * which are the ones that would visibly repaint the chat.
 */
export declare function chatLookDefaults(source: Record<string, unknown>): {
    userBubbleStyle: TaffyBubbleStyle;
    userBubbleBorder: TaffyBubbleBorder;
    composerStyle: TaffyComposerStyle;
    composerDecoration: TaffyComposerDecoration;
};
export declare function parseTaffySettings(value: unknown): TaffySettings;
export declare const DEFAULT_SETTINGS: TaffySettings;
/** @deprecated Use parseTaffySettings — kept for older imports/tests. */
export declare const TaffySettingsSchemaParser: {
    parse: typeof parseTaffySettings;
};
