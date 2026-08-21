export interface AssetManifest {
  version: number
  defaults: {
    avatar: string | null
    portrait: string | null
    banner: string | null
  }
  states: Record<string, string | null>
  limits: {
    avatarBytes: number
    imageBytes: number
    allowedMime: string[]
  }
}

export const PLUGIN_ASSET_ROUTE_PREFIX = '/plugins/@dsh-external/dsh-taffy-theme/assets'
export const PLUGIN_ASSET_BASE = `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy`

/** Bumped when shipped art changes so browsers skip the 24h asset cache. */
export const ASSET_SET_VERSION = '2026-08-22-fill-q'

export function buildAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '')
  return `${PLUGIN_ASSET_BASE}/${clean}?v=${ASSET_SET_VERSION}`
}
