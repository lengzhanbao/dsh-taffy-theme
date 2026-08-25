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
