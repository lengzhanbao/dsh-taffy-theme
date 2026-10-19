import type { TaffyColorConfig, TaffySettings } from '../config.js'

export type { TaffyColorConfig, TaffySettings }

/**
 * The theme's state vocabulary.
 *
 * Only `idle`, `streaming` and `tool-calling` are produced today, because those
 * are the only ones with an observable host signal — see src/state/adapter.ts.
 * The other three are reserved: they stay in the union so stored settings and
 * colour presets keep a stable shape, but nothing may render them until a real
 * signal exists.
 */
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
