import type { TaffyColorConfig, TaffySettings } from '../config.js'

export type { TaffyColorConfig, TaffySettings }

export type TaffyAgentState =
  | 'idle'
  | 'thinking'
  | 'tool-calling'
  | 'streaming'
  | 'success'
  | 'error'

export type TaffyColorPreset = TaffyColorConfig['preset']

export interface TaffyImageConfig {
  avatar?: string
  portrait?: string
  banner?: string
  stateImages?: Partial<Record<TaffyAgentState, string>>
}

export type TimePhase = 'morning' | 'afternoon' | 'evening' | 'night'
