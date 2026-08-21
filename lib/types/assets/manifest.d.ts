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
export declare const PLUGIN_ASSET_BASE = "/plugins/@dsh-external/dsh-taffy-theme/assets/taffy";
export declare function buildAssetUrl(relativePath: string): string;
