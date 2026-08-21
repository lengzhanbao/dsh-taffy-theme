import type { TimePhase } from '../state/types';
export declare function resolveTimePhase(date?: Date): TimePhase;
export declare function startTimePhaseTicker(onPhase: (phase: TimePhase) => void): () => void;
