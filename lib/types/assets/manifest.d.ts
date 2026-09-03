export interface AssetManifest {
    version: number;
    defaults: {
        avatar: string | null;
        portrait: string | null;
        banner: string | null;
    };
    states: Record<string, string | null>;
    limits: {
        avatarBytes: number;
        imageBytes: number;
        allowedMime: string[];
    };
}
export declare const PLUGIN_ASSET_ROUTE_PREFIX = "/plugins/@dsh-external/dsh-taffy-theme/assets";
export declare const PLUGIN_ASSET_BASE = "/plugins/@dsh-external/dsh-taffy-theme/assets/taffy";
/** Bumped when shipped art changes so browsers skip the 24h asset cache. */
export declare const ASSET_SET_VERSION = "2026-08-25-hero-avatar";
export declare function buildAssetUrl(relativePath: string): string;
