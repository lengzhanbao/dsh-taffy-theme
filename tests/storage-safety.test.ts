import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../src/config.ts'
import {
  STORAGE_KEY,
  loadSettings,
  readRaw,
  removeRaw,
  resetStorageFallback,
  saveSettings,
  writeRaw,
} from '../src/client/settings-store.ts'

/**
 * Stage A / P0 — storage safety.
 *
 * DSH aborts the entire web client when a plugin entry does not reach
 * `active`, so every storage access in this theme must be failure-tolerant.
 * These tests pin that contract: an unusable `localStorage` degrades to
 * session memory and never throws.
 */

const original = Object.getOwnPropertyDescriptor(window, 'localStorage')

function restoreStorage(): void {
  if (original) Object.defineProperty(window, 'localStorage', original)
  else Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'localStorage')
}

function fakeStorage(overrides: Partial<Storage> = {}) {
  const map = new Map<string, string>()
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value) },
    removeItem: (key: string) => { map.delete(key) },
    clear: () => { map.clear() },
    key: () => null,
    get length() { return map.size },
    ...overrides,
  } as unknown as Storage
  return { map, storage }
}

describe('settings storage safety', () => {
  beforeEach(() => {
    resetStorageFallback()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    restoreStorage()
    resetStorageFallback()
    vi.restoreAllMocks()
  })

  it('1. round-trips through a working localStorage', () => {
    const { map, storage } = fakeStorage()
    vi.stubGlobal('localStorage', storage)

    writeRaw(STORAGE_KEY, 'value')
    expect(map.get(STORAGE_KEY)).toBe('value')
    expect(readRaw(STORAGE_KEY)).toBe('value')

    saveSettings({ ...DEFAULT_SETTINGS, veilOpacity: 14 })
    expect(loadSettings().veilOpacity).toBe(14)
  })

  it('2. survives a localStorage getter that throws (storage disabled)', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('storage disabled by policy', 'SecurityError')
      },
    })

    expect(() => readRaw(STORAGE_KEY)).not.toThrow()
    expect(readRaw(STORAGE_KEY)).toBeNull()

    expect(() => loadSettings()).not.toThrow()
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)

    // A failed write must not abort the settings change; it stays in memory.
    expect(() => saveSettings({ ...DEFAULT_SETTINGS, veilOpacity: 20 })).not.toThrow()
    expect(loadSettings().veilOpacity).toBe(20)
  })

  it('3. degrades to session memory when the write fails (quota exceeded)', () => {
    const { map, storage } = fakeStorage({
      setItem: () => { throw new DOMException('quota exceeded', 'QuotaExceededError') },
    })
    vi.stubGlobal('localStorage', storage)

    const onChange = vi.fn()
    window.addEventListener('dsh-taffy-theme:settings-change', onChange)
    expect(() => saveSettings({ ...DEFAULT_SETTINGS, veilOpacity: 22 })).not.toThrow()
    window.removeEventListener('dsh-taffy-theme:settings-change', onChange)

    // Nothing reached durable storage, but the session still sees the value
    // and subscribers were still notified.
    expect(map.size).toBe(0)
    expect(loadSettings().veilOpacity).toBe(22)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('4. falls back to defaults on corrupt data and preserves it for recovery', () => {
    const { map, storage } = fakeStorage()
    vi.stubGlobal('localStorage', storage)
    map.set(STORAGE_KEY, '{ this is not json')

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    // A bad read must not erase what is stored.
    expect(map.get(STORAGE_KEY)).toBe('{ this is not json')
  })

  it('4b. falls back to defaults when the payload is valid JSON but schema-hostile', () => {
    const { map, storage } = fakeStorage()
    vi.stubGlobal('localStorage', storage)
    map.set(STORAGE_KEY, JSON.stringify({ veilOpacity: { nested: true } }))

    expect(() => loadSettings()).not.toThrow()
  })

  it('3b. write and remove never throw on unusable storage', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('denied', 'SecurityError') },
    })
    expect(() => readRaw(STORAGE_KEY)).not.toThrow()
    expect(() => writeRaw(STORAGE_KEY, 'x')).not.toThrow()
    expect(() => removeRaw(STORAGE_KEY)).not.toThrow()
    expect(readRaw(STORAGE_KEY)).toBeNull()
  })
})
