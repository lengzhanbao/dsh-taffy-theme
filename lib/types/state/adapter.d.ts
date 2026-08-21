import type { TaffyAgentState } from './types';
export declare function resetStateAdapter(): void;
export declare function mapRuntimeState(input: unknown): TaffyAgentState;
export declare function mapDomSignals(signals: {
    activeConversation?: boolean;
    composerPhase?: string | null;
    streaming?: boolean;
    hasToolCall?: boolean;
    error?: boolean;
    success?: boolean;
}, onState: (s: TaffyAgentState) => void): TaffyAgentState;
export declare function debounceState(state: TaffyAgentState): TaffyAgentState;
