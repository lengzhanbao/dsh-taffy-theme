export const PLUGIN_ASSET_ROUTE_PREFIX = '/plugins/@dsh-external/dsh-taffy-theme/assets';
export const PLUGIN_ASSET_BASE = `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy`;
export function buildAssetUrl(relativePath) {
    const clean = relativePath.replace(/^\/+/, '');
    return `${PLUGIN_ASSET_BASE}/${clean}`;
}
//# sourceMappingURL=manifest.js.map