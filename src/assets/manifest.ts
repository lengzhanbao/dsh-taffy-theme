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

export function buildAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '')
  return `${PLUGIN_ASSET_BASE}/${clean}`
}
