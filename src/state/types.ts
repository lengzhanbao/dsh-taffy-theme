export type TaffyAgentState =
  | 'idle'
  | 'thinking'
  | 'tool-calling'
  | 'streaming'
  | 'success'
  | 'error'

export type TaffyColorPreset = 'taffy-candy' | 'taffy-night' | 'taffy-mint' | 'custom'

export interface TaffyColorConfig {
  preset: TaffyColorPreset
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  surface?: string
  text?: string
  success?: string
  warning?: string
  error?: string
  dynamicEnabled: boolean
  dynamicIntensity: 'low' | 'standard' | 'high'
}

export interface TaffyImageConfig {
  avatar?: string
  portrait?: string
  banner?: string
  stateImages?: Partial<Record<TaffyAgentState, string>>
}

export interface TaffySettings {
  schemaVersion: number
  enabled: boolean
  displayName: string
  subtitle: string
  avatar: 'default' | string
  portrait: 'default' | 'off' | string
  preset: TaffyColorPreset
  dynamicEnabled: boolean
  dynamicIntensity: 'low' | 'standard' | 'high'
  timePhaseEnabled: boolean
  stateColorEnabled: boolean
  motion: 'off' | 'standard'
  reducedMotion: boolean
  veilStrength: 'thin' | 'standard' | 'thick'
  backgroundVeil: 'thin' | 'standard' | 'thick'
  veilOpacity: number
  acrylicPercent: number
  frameOpacity: number
  panelOpacity: number
  characterOpacity: number
  showLeftCharacter: boolean
  showRightCharacter: boolean
  showMascot: boolean
  colors: TaffyColorConfig
}

export type TimePhase = 'morning' | 'afternoon' | 'evening' | 'night'
