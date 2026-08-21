export interface TaffyMetricsPayload {
    scene?: string;
    at: string;
    enabled: boolean;
    selectorMisses: string[];
    frameWidth: number;
    frameHeight: number;
    frameHidden: boolean;
    frameCompact: boolean;
    phase: 'hero' | 'active' | 'unknown';
    viewportWidth: number;
    viewportHeight: number;
}
export declare function setMetricsEnabledGetter(getter: () => boolean): void;
export declare function metricsStampingEnabled(): boolean;
export declare function selectorMisses(doc: Document): string[];
export declare function readMetricsFromBody(body: HTMLElement, enabled: boolean, scene?: string): TaffyMetricsPayload;
export declare function stampMetrics(doc: Document, body: HTMLElement, scene?: string): void;
export declare function clearMetricsStamp(doc: Document): void;
export declare function resetMetricsStampState(): void;
