import type { TaffySettings } from '../state/types';
export interface ChromeObserverOptions {
    getSettings: () => TaffySettings;
    onNodes: (nodes: HTMLElement[]) => void;
    onSidebarChange?: () => void;
}
export declare function createChromeObserver(options: ChromeObserverOptions): {
    disconnect: () => void;
};
