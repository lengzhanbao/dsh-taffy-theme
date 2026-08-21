import type { TaffySettings } from '../state/types';
export declare const STORAGE_KEY = "dsh-taffy-theme:v1";
export declare const SETTINGS_CHANGE_EVENT = "dsh-taffy-theme:settings-change";
export declare function veilFromOpacity(percent: number): TaffySettings['backgroundVeil'];
export declare function veilFromPercent(percent: number): TaffySettings['backgroundVeil'];
export declare function loadSettings(): TaffySettings;
export declare function saveSettings(next: TaffySettings): void;
export declare function subscribeSettings(onChange: (settings: TaffySettings) => void): () => void;
