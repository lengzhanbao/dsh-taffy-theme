import type { TaffyAgentState } from '../state/types';
export interface StateViewOptions {
    onState: (state: TaffyAgentState) => void;
}
export declare function createStateObserver(options: StateViewOptions): MutationObserver;
export declare const STATE_LABELS: Record<TaffyAgentState, string>;
