import type { TaffySettings } from '../state/types'
import { DEFAULT_SETTINGS, parseTaffySettings } from '../config'

export const STORAGE_KEY = 'dsh-taffy-theme:v1'
export const SETTINGS_CHANGE_EVENT = 'dsh-taffy-theme:settings-change'

/**
 * Session mirror for values we could not persist. It is consulted only once
 * `localStorage` has proven unusable, so cross-tab `storage` events keep
 * working in the normal case instead of being shadowed by stale memory.
 */
const memoryFallback = new Map<string, string>()
let storageBroken = false
let storageFailureReported = false

function reportStorageFailure(error: unknown): void {
  if (storageFailureReported) return
  storageFailureReported = true
  // Settings still apply for this session; only durability is lost.
  console.warn(
    '[dsh-taffy-theme] persistent storage is unavailable; settings apply to this session only',
    error,
  )
}

/**
 * Read a raw key. Never throws: an unusable `localStorage` (disabled storage,
 * enterprise policy, sandboxed frame) degrades to the session mirror.
 */
export function readRaw(key: string): string | null {
  if (storageBroken) return memoryFallback.get(key) ?? null
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    storageBroken = true
    reportStorageFailure(error)
    return memoryFallback.get(key) ?? null
  }
}

/** Persist a raw key. Never throws: a failed write falls back to session memory. */
export function writeRaw(key: string, value: string): void {
  if (storageBroken) {
    memoryFallback.set(key, value)
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    // Quota exceeded or storage disabled mid-session.
    storageBroken = true
    reportStorageFailure(error)
    memoryFallback.set(key, value)
  }
}

/** Remove a raw key. Never throws. */
export function removeRaw(key: string): void {
  memoryFallback.delete(key)
  if (storageBroken) return
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    storageBroken = true
    reportStorageFailure(error)
  }
}

/** Test seam: clears the session mirror and the warn-once latches. */
export function resetStorageFallback(): void {
  memoryFallback.clear()
  storageBroken = false
  storageFailureReported = false
}

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
    const raw = readRaw(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return parseTaffySettings(migrateStoredSettings(JSON.parse(raw)))
  } catch {
    // Corrupt or unreadable payload: fall back to defaults without touching
    // what is stored, so a later good read can still recover the user's data.
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(next: TaffySettings): void {
  let clean: TaffySettings
  try {
    clean = parseTaffySettings(next)
  } catch {
    clean = { ...DEFAULT_SETTINGS }
  }
  try {
    writeRaw(STORAGE_KEY, JSON.stringify(clean))
  } catch (error) {
    // Serialization failure must not abort the settings change itself.
    reportStorageFailure(error)
  }
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
