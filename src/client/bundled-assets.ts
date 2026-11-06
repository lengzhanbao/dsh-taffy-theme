/** Default stage art URLs — served from the plugin assets directory, not inlined in client.js. */
import { buildAssetUrl } from '../assets/manifest'

export const BUNDLED_AVATAR = buildAssetUrl('avatar.webp')
export const BUNDLED_AVATAR_NIGHT = buildAssetUrl('avatar-night.webp')
export const BUNDLED_PORTRAIT = buildAssetUrl('portrait.webp')
export const BUNDLED_WALLPAPER_LIGHT = buildAssetUrl('wallpaper-light.webp')
export const BUNDLED_WALLPAPER_DARK = buildAssetUrl('wallpaper-dark.webp')
export const BUNDLED_LEFT_LIGHT = buildAssetUrl('left-light.webp')
export const BUNDLED_RIGHT_LIGHT = buildAssetUrl('right-light.webp')
export const BUNDLED_LEFT_DARK = buildAssetUrl('left-dark.webp')
export const BUNDLED_RIGHT_DARK = buildAssetUrl('right-dark.webp')


export const BUNDLED_HERO_AVATAR = buildAssetUrl('hero-avatar.webp')

/**
 * Selectable art shipped with 0.2.x. The eight files came from the redesign
 * bundle as 34 MB of PNG and are re-encoded here to WebP at 6% of the original
 * weight (1.03 MB total), which keeps the plugin installable.
 *
 * Ids are the stable names written into settings; the display labels live in
 * the settings panel so renaming a label never migrates stored preferences.
 */
export const BUNDLED_BACKGROUNDS = {
  observatory: buildAssetUrl('backgrounds/observatory.webp'),
  'observatory-light': buildAssetUrl('backgrounds/observatory-light.webp'),
  balcony: buildAssetUrl('backgrounds/balcony.webp'),
  'balcony-light': buildAssetUrl('backgrounds/balcony-light.webp'),
  studio: buildAssetUrl('backgrounds/studio.webp'),
  'studio-light': buildAssetUrl('backgrounds/studio-light.webp'),
  atelier: buildAssetUrl('backgrounds/atelier.webp'),
  'atelier-light': buildAssetUrl('backgrounds/atelier-light.webp'),
  piano: buildAssetUrl('backgrounds/piano.webp'),
  'piano-light': buildAssetUrl('backgrounds/piano-light.webp'),
} as const

export const BUNDLED_SIDEBAR_WATERMARKS = {
  'celestial-plum': buildAssetUrl('sidebar/celestial-plum.webp'),
  'celestial-plum-light': buildAssetUrl('sidebar/celestial-plum-light.webp'),
  'celestial-sidebar': buildAssetUrl('sidebar/celestial-sidebar.webp'),
  'celestial-sidebar-light': buildAssetUrl('sidebar/celestial-sidebar-light.webp'),
} as const

export const BUNDLED_CHIBI = {
  'open-arms': buildAssetUrl('chibi/open-arms.webp'),
  'cat-hug': buildAssetUrl('chibi/cat-hug.webp'),
} as const

export type BackgroundId = keyof typeof BUNDLED_BACKGROUNDS
export type SidebarWatermarkId = keyof typeof BUNDLED_SIDEBAR_WATERMARKS
export type ChibiId = keyof typeof BUNDLED_CHIBI
