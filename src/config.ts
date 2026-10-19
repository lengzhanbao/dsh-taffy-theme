import z from 'schemastery'

/** Cordis plugin config — host has no tunables; UI prefs live in browser localStorage. */
export const PluginConfig = z.object({})

export const SETTINGS_NAMESPACE = 'taffy-theme'

const colorPreset = z.union([
  z.const('taffy-candy'),
  z.const('taffy-night'),
  z.const('taffy-mint'),
  z.const('custom'),
]).default('taffy-candy')

const dynamicIntensity = z.union([
  z.const('low'),
  z.const('standard'),
  z.const('high'),
]).default('standard')

const motion = z.union([
  z.const('off'),
  z.const('standard'),
]).default('standard')

export const TaffyColorConfigSchema = z.object({
  preset: colorPreset,
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  success: z.string(),
  warning: z.string(),
  error: z.string(),
  dynamicEnabled: z.boolean().default(true),
  dynamicIntensity,
})

export const TaffySettingsSchema = z.object({
  schemaVersion: z.const(1).default(1),
  enabled: z.boolean().default(true),
  displayName: z.string().default('永雏塔菲'),
  subtitle: z.string().default('王牌侦探发明家喵'),
  heroHeadline: z.string().default('关注塔菲喵！关注塔菲谢谢喵！'),
  avatar: z.union([z.const('default'), z.string()]).default('default'),
  portrait: z.union([z.const('default'), z.const('off'), z.string()]).default('default'),
  timePhaseEnabled: z.boolean().default(true),
  stateColorEnabled: z.boolean().default(true),
  motion,
  reducedMotion: z.boolean().default(false),
  veilOpacity: z.number().min(0).max(100).default(10),
  acrylicPercent: z.number().min(0).max(100).default(70),
  frameOpacity: z.number().min(0).max(100).default(85),
  panelOpacity: z.number().min(0).max(100).default(82),
  characterOpacity: z.number().min(0).max(100).default(100),
  showLeftCharacter: z.boolean().default(true),
  showRightCharacter: z.boolean().default(true),
  showMascot: z.boolean().default(true),
  colors: TaffyColorConfigSchema,
})

export type TaffyColorPreset = 'taffy-candy' | 'taffy-night' | 'taffy-mint' | 'custom'
export type TaffyDynamicIntensity = 'low' | 'standard' | 'high'
export type TaffyMotion = 'off' | 'standard'

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
  preset: TaffyColorPreset
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  success: string
  warning: string
  error: string
  dynamicEnabled: boolean
  dynamicIntensity: TaffyDynamicIntensity
}

export interface TaffySettings {
  schemaVersion: 1
  enabled: boolean
  displayName: string
  subtitle: string
  heroHeadline: string
  avatar: string
  portrait: string
  timePhaseEnabled: boolean
  stateColorEnabled: boolean
  motion: TaffyMotion
  reducedMotion: boolean
  veilOpacity: number
  acrylicPercent: number
  frameOpacity: number
  panelOpacity: number
  characterOpacity: number
  showLeftCharacter: boolean
  showRightCharacter: boolean
  showMascot: boolean
  colors: TaffyColorConfig
}

export function parseTaffySettings(value: unknown): TaffySettings {
  // The schema resolves defaults and `!!js` expressions; the manual rebuild
  // below produces the plain runtime shape, hence the double assertion.
  const resolved = TaffySettingsSchema(
    value && typeof value === 'object' ? value : {},
  ) as unknown as TaffySettings
  return {
    schemaVersion: 1,
    enabled: resolved.enabled,
    displayName: resolved.displayName,
    subtitle: resolved.subtitle,
    heroHeadline: resolved.heroHeadline,
    avatar: resolved.avatar,
    portrait: resolved.portrait,
    timePhaseEnabled: resolved.timePhaseEnabled,
    stateColorEnabled: resolved.stateColorEnabled,
    motion: resolved.motion,
    reducedMotion: resolved.reducedMotion,
    veilOpacity: resolved.veilOpacity,
    acrylicPercent: resolved.acrylicPercent,
    frameOpacity: resolved.frameOpacity,
    panelOpacity: resolved.panelOpacity,
    characterOpacity: resolved.characterOpacity,
    showLeftCharacter: resolved.showLeftCharacter,
    showRightCharacter: resolved.showRightCharacter,
    showMascot: resolved.showMascot,
    colors: {
      preset: resolved.colors.preset,
      primary: resolved.colors.primary,
      secondary: resolved.colors.secondary,
      accent: resolved.colors.accent,
      background: resolved.colors.background,
      surface: resolved.colors.surface,
      text: resolved.colors.text,
      success: resolved.colors.success,
      warning: resolved.colors.warning,
      error: resolved.colors.error,
      dynamicEnabled: resolved.colors.dynamicEnabled,
      dynamicIntensity: resolved.colors.dynamicIntensity,
    },
  }
}

export const DEFAULT_SETTINGS: TaffySettings = parseTaffySettings({})

/** @deprecated Use parseTaffySettings — kept for older imports/tests. */
export const TaffySettingsSchemaParser = { parse: parseTaffySettings }
