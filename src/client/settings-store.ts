import type { TaffySettings } from '../state/types'
import { DEFAULT_SETTINGS } from '../config'

export const STORAGE_KEY = 'dsh-taffy-theme:v1'
export const SETTINGS_CHANGE_EVENT = 'dsh-taffy-theme:settings-change'

const VEILS = ['thin', 'standard', 'thick'] as const

function clampPercent(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(100, Math.round(n)))
}

function isVeil(value: unknown): value is TaffySettings['backgroundVeil'] {
  return VEILS.includes(value as TaffySettings['backgroundVeil'])
}

function percentFromVeil(veil: TaffySettings['veilStrength']): number {
  if (veil === 'thin') return 8
  if (veil === 'thick') return 18
  return 12
}

export function veilFromOpacity(percent: number): TaffySettings['backgroundVeil'] {
  if (percent <= 9) return 'thin'
  if (percent >= 16) return 'thick'
  return 'standard'
}

export function veilFromPercent(percent: number): TaffySettings['backgroundVeil'] {
  return veilFromOpacity(percent)
}

export function loadSettings(): TaffySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<TaffySettings>
    const backgroundVeil = isVeil(parsed.backgroundVeil)
      ? parsed.backgroundVeil
      : isVeil(parsed.veilStrength)
        ? parsed.veilStrength
        : DEFAULT_SETTINGS.backgroundVeil
    const veilOpacity = parsed.veilOpacity == null
      ? percentFromVeil(backgroundVeil)
      : clampPercent(parsed.veilOpacity, DEFAULT_SETTINGS.veilOpacity)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      veilOpacity,
      veilStrength: veilFromOpacity(veilOpacity),
      backgroundVeil: veilFromOpacity(veilOpacity),
      acrylicPercent: clampPercent(parsed.acrylicPercent, DEFAULT_SETTINGS.acrylicPercent),
      panelOpacity: clampPercent(parsed.panelOpacity, DEFAULT_SETTINGS.panelOpacity),
      frameOpacity: clampPercent(parsed.frameOpacity, DEFAULT_SETTINGS.frameOpacity),
      characterOpacity: clampPercent(parsed.characterOpacity, DEFAULT_SETTINGS.characterOpacity),
      showLeftCharacter: parsed.showLeftCharacter !== false,
      showRightCharacter: parsed.showRightCharacter !== false,
      showMascot: parsed.showMascot !== false,
      colors: { ...DEFAULT_SETTINGS.colors, ...parsed.colors },
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(next: TaffySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: next }))
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
