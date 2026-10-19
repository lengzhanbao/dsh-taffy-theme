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

/**
 * Art selection is a plain string rather than a union of consts so a future
 * asset id does not need a schema migration; `resolveSceneBackground` validates
 * against the shipped id list and falls back to the mode default. Storing an
 * id that no longer exists degrades to the default instead of breaking.
 */
const artChoice = z.string().default('default')

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
  backgroundHero: artChoice,
  backgroundFunctional: artChoice,
  sidebarWatermark: artChoice,
  chibiMascot: artChoice,
  sidebarDecoration: z.union([
    z.const('off'),
    z.const('simple'),
    z.const('full'),
  ]).default('simple'),
  // Chat look. Defaults are resolved in parseTaffySettings so an existing
  // install keeps the look it already has (see CHAT_LOOK_DEFAULTS below).
  userBubbleStyle: artChoice,
  userBubbleOpacity: z.number().min(55).max(100).default(72),
  userBubbleRadius: z.number().min(6).max(28).default(18),
  userBubbleMaxWidth: z.number().min(60).max(90).default(78),
  userBubbleBorder: artChoice,
  composerStyle: artChoice,
  composerDecoration: artChoice,
  composerOpacity: z.number().min(65).max(100).default(82),
  composerRadius: z.number().min(8).max(24).default(16),
  colors: TaffyColorConfigSchema,
})

export type TaffyColorPreset = 'taffy-candy' | 'taffy-night' | 'taffy-mint' | 'custom'
export type TaffyDynamicIntensity = 'low' | 'standard' | 'high'
export type TaffyMotion = 'off' | 'standard'
export type TaffySidebarDecoration = 'off' | 'simple' | 'full'
export type TaffyBubbleStyle = 'native' | 'glass' | 'ornate'
export type TaffyBubbleBorder = 'off' | 'subtle' | 'accent'
export type TaffyComposerStyle = 'native' | 'glass' | 'ornate'
export type TaffyComposerDecoration = 'off' | 'low' | 'full'

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
  /** `default` means the art that belongs to the active mode; otherwise an id from BUNDLED_BACKGROUNDS. */
  backgroundHero: string
  backgroundFunctional: string
  /** `default` = shipped watermark, `none` = no watermark layer. */
  sidebarWatermark: string
  /** `default` = the classic mascot, otherwise an id from BUNDLED_CHIBI. */
  chibiMascot: string
  /**
   * `simple` keeps the ornaments but never touches native control geometry.
   * `full` opts into the ornate restyle of the sidebar's own buttons (the
   * 56px brand chip, the 40px rail toggle…). `off` drops the whole sidebar
   * decoration layer.
   */
  sidebarDecoration: TaffySidebarDecoration
  /** native | glass | ornate — how the user's own messages are drawn. */
  userBubbleStyle: TaffyBubbleStyle
  /** Background opacity percent; applied through the bubble colour token, never element opacity. */
  userBubbleOpacity: number
  userBubbleRadius: number
  userBubbleMaxWidth: number
  /** off | subtle | accent */
  userBubbleBorder: TaffyBubbleBorder
  /** native | glass | ornate */
  composerStyle: TaffyComposerStyle
  /** off | low | full — how much filigree the composer draws. */
  composerDecoration: TaffyComposerDecoration
  composerOpacity: number
  composerRadius: number
  colors: TaffyColorConfig
}

const NEW_CHAT_KEYS = [
  'userBubbleStyle', 'userBubbleOpacity', 'userBubbleRadius', 'userBubbleMaxWidth',
  'userBubbleBorder', 'composerStyle', 'composerDecoration', 'composerOpacity', 'composerRadius',
] as const

/**
 * A stored config that predates the chat-look settings is an *existing* install:
 * it must come out of the upgrade looking exactly as it did. A config that
 * already carries these keys (or an empty config, i.e. a fresh install) gets the
 * intended new defaults.
 *
 * Numbers and enums are not part of this decision — only the string-style fields,
 * which are the ones that would visibly repaint the chat.
 */
export function chatLookDefaults(
  source: Record<string, unknown>,
): {
  userBubbleStyle: TaffyBubbleStyle
  userBubbleBorder: TaffyBubbleBorder
  composerStyle: TaffyComposerStyle
  composerDecoration: TaffyComposerDecoration
} {
  const hasAny = NEW_CHAT_KEYS.some((key) => key in source)
  const hasStored = Object.keys(source).length > 0
  if (hasStored && !hasAny) {
    // Existing install: today's look is the native bubble and the full filigree.
    return {
      userBubbleStyle: pick(source.userBubbleStyle, BUBBLE_STYLES, 'native'),
      userBubbleBorder: pick(source.userBubbleBorder, BUBBLE_BORDERS, 'off'),
      composerStyle: pick(source.composerStyle, COMPOSER_STYLES, 'native'),
      composerDecoration: pick(source.composerDecoration, COMPOSER_DECORATIONS, 'full'),
    }
  }
  return {
    userBubbleStyle: pick(source.userBubbleStyle, BUBBLE_STYLES, 'glass'),
    userBubbleBorder: pick(source.userBubbleBorder, BUBBLE_BORDERS, 'subtle'),
    composerStyle: pick(source.composerStyle, COMPOSER_STYLES, 'glass'),
    composerDecoration: pick(source.composerDecoration, COMPOSER_DECORATIONS, 'low'),
  }
}

const BUBBLE_STYLES = ['native', 'glass', 'ornate'] as const
const BUBBLE_BORDERS = ['off', 'subtle', 'accent'] as const
const COMPOSER_STYLES = ['native', 'glass', 'ornate'] as const
const COMPOSER_DECORATIONS = ['off', 'low', 'full'] as const

function pick<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return typeof raw === 'string' && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}

/**
 * schemastery throws on an out-of-range number instead of clamping, so one bad
 * persisted value (a future version, a hand edit, a partial write) would take
 * the whole settings load down with it. Clamp first: the range is the contract,
 * and a value outside it is a value we can faithfully repair rather than reject.
 */
const NUMERIC_RANGES: Record<string, [number, number]> = {
  veilOpacity: [0, 100],
  acrylicPercent: [0, 100],
  frameOpacity: [0, 100],
  panelOpacity: [0, 100],
  characterOpacity: [0, 100],
  userBubbleOpacity: [55, 100],
  userBubbleRadius: [6, 28],
  userBubbleMaxWidth: [60, 90],
  composerOpacity: [65, 100],
  composerRadius: [8, 24],
}

function clampRanges(source: Record<string, unknown>): Record<string, unknown> {
  let out: Record<string, unknown> | undefined
  for (const [key, [min, max]] of Object.entries(NUMERIC_RANGES)) {
    const raw = source[key]
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue
    const clamped = Math.min(max, Math.max(min, raw))
    if (clamped === raw) continue
    out = out ?? { ...source }
    out[key] = clamped
  }
  return out ?? source
}

export function parseTaffySettings(value: unknown): TaffySettings {
  // The schema resolves defaults and `!!js` expressions; the manual rebuild
  // below produces the plain runtime shape, hence the double assertion.
  const source = clampRanges(value && typeof value === 'object' ? (value as Record<string, unknown>) : {})
  const resolved = TaffySettingsSchema(source) as unknown as TaffySettings
  // Migration: an install that already has stored settings must keep the look it
  // has today. chatLookDefaults() therefore answers "native / full" for an
  // existing config and "glass / low" for a fresh one.
  const chat = chatLookDefaults(source)
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
    backgroundHero: resolved.backgroundHero,
    backgroundFunctional: resolved.backgroundFunctional,
    sidebarWatermark: resolved.sidebarWatermark,
    chibiMascot: resolved.chibiMascot,
    sidebarDecoration: resolved.sidebarDecoration,
    userBubbleStyle: chat.userBubbleStyle,
    userBubbleOpacity: resolved.userBubbleOpacity,
    userBubbleRadius: resolved.userBubbleRadius,
    userBubbleMaxWidth: resolved.userBubbleMaxWidth,
    userBubbleBorder: chat.userBubbleBorder,
    composerStyle: chat.composerStyle,
    composerDecoration: chat.composerDecoration,
    composerOpacity: resolved.composerOpacity,
    composerRadius: resolved.composerRadius,
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

