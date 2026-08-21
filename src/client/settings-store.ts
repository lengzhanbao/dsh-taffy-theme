import type { TaffySettings } from '../state/types'
import { DEFAULT_SETTINGS, parseTaffySettings } from '../config'

export const STORAGE_KEY = 'dsh-taffy-theme:v1'
export const SETTINGS_CHANGE_EVENT = 'dsh-taffy-theme:settings-change'

const LEGACY_VEILS = ['thin', 'standard', 'thick'] as const
type LegacyVeil = (typeof LEGACY_VEILS)[number]

function isLegacyVeil(value: unknown): value is LegacyVeil {
  return typeof value === 'string' && (LEGACY_VEILS as readonly string[]).includes(value)
}

function percentFromLegacyVeil(veil: LegacyVeil): number {
  if (veil === 'thin') return 8
  if (veil === 'thick') return 18
  return 12
}

export function veilFromOpacity(percent: number): LegacyVeil {
  if (percent <= 9) return 'thin'
  if (percent >= 16) return 'thick'
  return 'standard'
}

export function veilBucket(settings: Pick<TaffySettings, 'veilOpacity'>): LegacyVeil {
  return veilFromOpacity(settings.veilOpacity)
}

function migrateStoredSettings(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return {}
  const input = { ...(raw as Record<string, unknown>) }
  const colors = {
    ...(typeof input.colors === 'object' && input.colors
      ? input.colors as Record<string, unknown>
      : {}),
  }

  if (input.preset !== undefined && colors.preset === undefined) colors.preset = input.preset
  if (input.dynamicEnabled !== undefined && colors.dynamicEnabled === undefined) {
    colors.dynamicEnabled = input.dynamicEnabled
  }
  if (input.dynamicIntensity !== undefined && colors.dynamicIntensity === undefined) {
    colors.dynamicIntensity = input.dynamicIntensity
  }
  input.colors = colors
  delete input.preset
  delete input.dynamicEnabled
  delete input.dynamicIntensity

  if (input.veilOpacity == null) {
    const legacy = input.backgroundVeil ?? input.veilStrength
    if (isLegacyVeil(legacy)) input.veilOpacity = percentFromLegacyVeil(legacy)
  }
  delete input.veilStrength
  delete input.backgroundVeil

  return input
}

export function loadSettings(): TaffySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return parseTaffySettings(migrateStoredSettings(JSON.parse(raw)))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(next: TaffySettings): void {
  const clean = parseTaffySettings(next)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: clean }))
}

export function subscribeSettings(onChange: (settings: TaffySettings) => void): () => void {
  const handler = () => onChange(loadSettings())
  window.addEventListener('storage', handler)
  window.addEventListener(SETTINGS_CHANGE_EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(SETTINGS_CHANGE_EVENT, handler)
  }
}
