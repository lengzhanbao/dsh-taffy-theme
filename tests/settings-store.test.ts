import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../src/config.ts'
import { SETTINGS_CHANGE_EVENT, loadSettings, saveSettings, subscribeSettings, veilBucket, veilFromOpacity } from '../src/client/settings-store.ts'

const STORAGE_KEY = 'dsh-taffy-theme:v1'
const memory = new Map<string, string>()

describe('settings store', () => {
  beforeEach(() => {
    memory.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value) },
      removeItem: (key: string) => { memory.delete(key) },
      clear: () => { memory.clear() },
    })
  })

  it('returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('migrates legacy veil and duplicate top-level fields', () => {
    memory.set(STORAGE_KEY, JSON.stringify({
      enabled: true,
      preset: 'taffy-night',
      dynamicEnabled: false,
      dynamicIntensity: 'high',
      backgroundVeil: 'thick',
      veilStrength: 'thick',
      staleField: 'remove-me',
    }))
    const settings = loadSettings()
    expect(settings.colors.preset).toBe('taffy-night')
    expect(settings.colors.dynamicEnabled).toBe(false)
    expect(settings.colors.dynamicIntensity).toBe('high')
    expect(settings.veilOpacity).toBe(18)
    expect(veilBucket(settings)).toBe('thick')
    expect(settings).not.toHaveProperty('staleField')
    expect(settings).not.toHaveProperty('preset')
    expect(settings).not.toHaveProperty('backgroundVeil')
  })

  it('persists only schema-valid fields', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      veilOpacity: 14,
    })
    const raw = JSON.parse(memory.get(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    expect(raw.veilOpacity).toBe(14)
    expect(raw).not.toHaveProperty('veilStrength')
    expect(veilFromOpacity(14)).toBe('standard')
  })
})

describe('settings subscription', () => {
  it('uses the value carried by the change event, not a storage read-back', () => {
    // The first click failed to repaint whenever the subscriber re-read storage:
    // it could still see the previous value. The event detail is authoritative.
    const seen: string[] = []
    const off = subscribeSettings((next) => seen.push(next.backgroundHero))

    window.localStorage.setItem('dsh-taffy-theme:v1', JSON.stringify({ backgroundHero: 'default' }))
    window.dispatchEvent(
      new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { ...DEFAULT_SETTINGS, backgroundHero: 'observatory-light' } }),
    )
    off()

    expect(seen).toEqual(['observatory-light'])
    expect(loadSettings().backgroundHero).toBe('default')
  })
})
