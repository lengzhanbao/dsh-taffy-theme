import type { TaffyImageConfig, TaffySettings } from '../state/types';
export declare function isNightScene(root?: HTMLElement): boolean;
export declare function resolveAvatarUrl(settings: TaffySettings, custom?: TaffyImageConfig, night?: boolean): string;
export declare function resolvePortraitUrl(settings: TaffySettings, custom?: TaffyImageConfig): string | null;
export declare function resolveBannerUrl(settings: TaffySettings, custom?: TaffyImageConfig): string | null;
export declare function resolveWallpaperUrl(night: boolean): string;
export declare function resolvePortraitFallback(): string;
export declare function resolveFigureUrls(night: boolean): {
    left: string;
    right: string;
};
export declare function resolveQChromeUrls(settings: TaffySettings): {
    face: string;
    send: string;
    stop: string;
    newSession: string;
    settings: string;
    brand: string;
    command: string;
};
