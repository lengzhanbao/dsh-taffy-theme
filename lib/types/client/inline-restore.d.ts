export interface InlineStyleSnapshot {
    key: string;
    value: string;
    priority: string;
}
export declare function snapshotInlineStyles(element: HTMLElement, keys: readonly string[]): InlineStyleSnapshot[];
export declare function restoreInlineStyles(element: HTMLElement, snapshot: readonly InlineStyleSnapshot[]): void;
