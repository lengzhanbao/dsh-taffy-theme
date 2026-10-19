import {
  BUNDLED_AVATAR,
  BUNDLED_AVATAR_NIGHT,
  BUNDLED_BACKGROUNDS,
  BUNDLED_CHIBI,
  BUNDLED_LEFT_DARK,
  BUNDLED_LEFT_LIGHT,
  BUNDLED_PORTRAIT,
  BUNDLED_RIGHT_DARK,
  BUNDLED_RIGHT_LIGHT,
  BUNDLED_SIDEBAR_WATERMARKS,
  BUNDLED_WALLPAPER_DARK,
  BUNDLED_WALLPAPER_LIGHT,
} from '../client/bundled-assets'
import type { BackgroundId, ChibiId, SidebarWatermarkId } from '../client/bundled-assets'
import {
  BUNDLED_Q_BRAND,
  BUNDLED_Q_BRAND_RIGHT,
  BUNDLED_Q_COMMAND,
  BUNDLED_Q_FACE,
  BUNDLED_Q_NEW,
  BUNDLED_Q_SEND,
  BUNDLED_Q_SETTINGS,
  BUNDLED_Q_STOP,
} from '../client/bundled-q'
import type { TaffyImageConfig, TaffySettings } from '../state/types'
import { isAllowedImageProtocol } from './validate'

export function isNightScene(root: HTMLElement = document.body): boolean {
  return root.hasAttribute('data-ds-dark-theme')
    || root.getAttribute('data-taffy-preset') === 'taffy-night'
}

function pickImage(candidate: string, fallback: string): string {
  return candidate && isAllowedImageProtocol(candidate) ? candidate : fallback
}

export function resolveAvatarUrl(settings: TaffySettings, custom?: TaffyImageConfig, night = isNightScene()): string {
  const fallback = night && BUNDLED_AVATAR_NIGHT ? BUNDLED_AVATAR_NIGHT : BUNDLED_AVATAR
  const candidate = custom?.avatar
    ?? (settings.avatar !== 'default' ? settings.avatar : undefined)
    ?? fallback
  return pickImage(candidate, fallback)
}

export function resolvePortraitUrl(settings: TaffySettings, custom?: TaffyImageConfig): string | null {
  if (settings.portrait === 'off') return null
  const candidate = custom?.portrait
    ?? (settings.portrait !== 'default' ? settings.portrait : undefined)
    ?? BUNDLED_PORTRAIT
  return pickImage(candidate, BUNDLED_PORTRAIT)
}

export function resolveBannerUrl(settings: TaffySettings, custom?: TaffyImageConfig): string | null {
  const candidate = custom?.banner
  if (!candidate) return null
  return isAllowedImageProtocol(candidate) ? candidate : null
}

export function resolveWallpaperUrl(night: boolean): string {
  const candidate = night ? BUNDLED_WALLPAPER_DARK : BUNDLED_WALLPAPER_LIGHT
  return candidate && isAllowedImageProtocol(candidate) ? candidate : ''
}

const BACKGROUND_IDS = Object.keys(BUNDLED_BACKGROUNDS)
const SIDEBAR_IDS = Object.keys(BUNDLED_SIDEBAR_WATERMARKS)
const CHIBI_IDS = Object.keys(BUNDLED_CHIBI)

/**
 * Defaults follow the "balanced" combination in the redesign bundle
 * (`code_guides/05`, `specs/08`): a complete main visual for the hero, the
 * readable studio for functional surfaces, the quieter sidebar portrait, and
 * the friendlier chibi.
 */
/**
 * There are deliberately no "new art" defaults. Upgrading must not change what
 * the user already sees: `default` means the classic wallpaper for the active
 * mode, no watermark layer, and the round avatar. Every supplied asset is an
 * explicit choice from the settings panel.
 */

/**
 * Backdrop for the current scene.
 *
 * The supplied art is Astral Night material — five night interiors — so it is
 * the dark-mode backdrop; Pearl Bloom (light) keeps the wallpaper drawn for it.
 * An explicit id overrides that in either mode, because choosing a picture is a
 * direct instruction while choosing `default` is not.
 */
export function resolveSceneBackground(
  settings: TaffySettings,
  scene: { night: boolean; functional: boolean },
): string {
  const chosen = scene.functional ? settings.backgroundFunctional : settings.backgroundHero
  // The classic pair stays selectable forever; these two ids are how a light
  // theme can opt into the dark wallpaper and vice versa.
  if (chosen === 'classic-light') return resolveWallpaperUrl(false)
  if (chosen === 'classic-dark') return resolveWallpaperUrl(true)
  if (chosen !== 'default' && BACKGROUND_IDS.includes(chosen)) {
    return pickImage(BUNDLED_BACKGROUNDS[chosen as BackgroundId], '')
  }
  return resolveWallpaperUrl(scene.night)
}

/**
 * The sidebar watermark. This is a layer the client owns — unlike the earlier
 * plan of attenuating a half-body figure, which only ever existed inside the
 * wallpaper bitmap and could not be addressed separately.
 * See docs/ASTRAL-ATELIER.md §1.
 */
export function resolveSidebarWatermarkUrl(settings: TaffySettings): string {
  // `default` is "no layer", which is what every existing install looks like
  // today. The watermark is something people turn on, never something they have
  // to turn off after an upgrade.
  const chosen = settings.sidebarWatermark
  if (chosen === 'none' || chosen === 'default') return ''
  if (SIDEBAR_IDS.includes(chosen)) {
    return pickImage(BUNDLED_SIDEBAR_WATERMARKS[chosen as SidebarWatermarkId], '')
  }
  return ''
}

/** The bottom-of-sidebar mascot. `classic` restores the round avatar. */
export function resolveChibiUrl(settings: TaffySettings): string {
  const chosen = settings.chibiMascot
  if (CHIBI_IDS.includes(chosen)) return pickImage(BUNDLED_CHIBI[chosen as ChibiId], '')
  // Anything unrecognised, including the default, keeps the avatar mascot that
  // shipped before the art pack existed.
  return resolveAvatarUrl(settings)
}

export function resolvePortraitFallback(): string {
  return pickImage(BUNDLED_PORTRAIT, BUNDLED_AVATAR)
}

export function resolveFigureUrls(night: boolean): { left: string; right: string } {
  const left = night ? BUNDLED_LEFT_DARK : BUNDLED_LEFT_LIGHT
  const right = night ? BUNDLED_RIGHT_DARK : BUNDLED_RIGHT_LIGHT
  return {
    left: pickImage(left, BUNDLED_PORTRAIT),
    right: pickImage(right, BUNDLED_PORTRAIT),
  }
}

export function resolveQChromeUrls(settings: TaffySettings): {
  face: string
  send: string
  stop: string
  newSession: string
  settings: string
  brand: string
  brandRight: string
  command: string
} {
  const avatar = resolveAvatarUrl(settings)
  const portrait = resolvePortraitUrl(settings) ?? avatar
  return {
    face: pickImage(BUNDLED_Q_FACE, avatar),
    send: pickImage(BUNDLED_Q_SEND, avatar),
    stop: pickImage(BUNDLED_Q_STOP, avatar),
    newSession: pickImage(BUNDLED_Q_NEW, avatar),
    settings: pickImage(BUNDLED_Q_SETTINGS, avatar),
    brand: pickImage(BUNDLED_Q_BRAND, portrait),
    brandRight: pickImage(BUNDLED_Q_BRAND_RIGHT, portrait),
    command: pickImage(BUNDLED_Q_COMMAND, portrait),
  }
}

