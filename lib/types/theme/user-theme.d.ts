import type { TaffyColorConfig } from '../state/types';
import { type InlineStyleSnapshot } from '../client/inline-restore';
export interface ThemeTokens {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    success: string;
    warning: string;
    error: string;
}
export declare function resolveThemeTokens(colors: TaffyColorConfig): ThemeTokens;
export declare function snapshotThemeTokens(root: HTMLElement): InlineStyleSnapshot[];
export declare function applyThemeTokens(root: HTMLElement, tokens: ThemeTokens): void;
export declare function restoreThemeTokens(root: HTMLElement, snapshot: readonly InlineStyleSnapshot[]): void;
