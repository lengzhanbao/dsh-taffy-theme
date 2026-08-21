export const PLUGIN_ASSET_BASE = '/plugins/@dsh-external/dsh-taffy-theme/assets/taffy';
export function buildAssetUrl(relativePath) {
    const clean = relativePath.replace(/^\/+/, '');
    return `${PLUGIN_ASSET_BASE}/${clean}`;
}
//# sourceMappingURL=manifest.js.map