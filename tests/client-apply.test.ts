import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context as DeepseekContext } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'
import { SKIN_OWNER } from '../src/client/chrome-selectors.ts'
import { STYLE_ID } from '../src/client/styles.ts'
import { SETTINGS_CHANGE_EVENT, resetStorageFallback } from '../src/client/settings-store.ts'

/**
 * Stage A / P0 — client lifecycle and failure isolation.
 *
 * DSH refuses to mount the whole web client when a plugin entry fails to
 * activate, so `apply()` must never throw, and a partial init must not leave
 * observers, timers, style nodes, chrome or host-style overrides behind.
 *
 * Note: this jsdom environment runs on an opaque origin, so `window.localStorage`
 * is genuinely absent. The theme reads it through `window`, so both `window`
 * and the bare global are defined here.
 */

const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')

interface Harness {
  ctx: DeepseekContext
  dispose: () => void
}

function createHarness(): Harness {
  const disposers: Array<() => void> = []
  const ctx = {
    effect(fn: () => unknown) {
      const result = fn()
      if (typeof result === 'function') disposers.push(result as () => void)
      return result
    },
    locale: { register: () => () => undefined },
    slots: {
      inject: (_key: string, callback: () => unknown) => callback(),
      register: () => () => undefined,
    },
    on: () => () => undefined,
  } as unknown as DeepseekContext
  return {
    ctx,
    dispose: () => { while (disposers.length > 0) disposers.pop()?.() },
  }
}

/** Define a global on both `window` and the bare global scope. */
function defineGlobal(name: string, value: unknown): void {
  vi.stubGlobal(name, value)
  Object.defineProperty(window, name, { configurable: true, writable: true, value })
}

function installStorage(overrides: Partial<Storage> = {}): Map<string, string> {
  const map = new Map<string, string>()
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value) },
    removeItem: (key: string) => { map.delete(key) },
    clear: () => map.clear(),
    key: () => null,
    get length() { return map.size },
    ...overrides,
  } as unknown as Storage
  defineGlobal('localStorage', storage)
  return map
}

function stubDomApis(): void {
  defineGlobal('requestAnimationFrame', () => 1)
  defineGlobal('cancelAnimationFrame', () => undefined)
  defineGlobal('ResizeObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  })
  defineGlobal('matchMedia', () => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }))
}

function styleNodeCount(): number {
  return document.querySelectorAll(`#${STYLE_ID}`).length
}

function ownedNodeCount(): number {
  return document.querySelectorAll(`[data-skin-owner="${SKIN_OWNER}"]`).length
}

function themeAttributeCount(): number {
  let count = 0
  for (const attribute of Array.from(document.body.attributes)) {
    if (attribute.name.startsWith('data-taffy-') || attribute.name === 'data-dsh-taffy-theme') count += 1
  }
  return count
}

describe('client apply failure isolation', () => {
  beforeEach(() => {
    installStorage()
    resetStorageFallback()
    stubDomApis()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage)
    else Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'localStorage')
    resetStorageFallback()
    vi.restoreAllMocks()
    document.getElementById(STYLE_ID)?.remove()
    document.querySelectorAll(`[data-skin-owner="${SKIN_OWNER}"]`).forEach((node) => node.remove())
    document.documentElement.removeAttribute('data-dsh-taffy-theme')
    for (const attribute of Array.from(document.body.attributes)) {
      if (attribute.name.startsWith('data-taffy-') || attribute.name === 'data-dsh-taffy-theme') {
        document.body.removeAttribute(attribute.name)
      }
    }
  })

  it('6. a repeated apply() keeps a single style node and cleans up fully', () => {
    const first = createHarness()
    apply(first.ctx)
    expect(styleNodeCount()).toBe(1)

    const second = createHarness()
    apply(second.ctx)
    // Idempotent style injection: a second entry must not stack a second sheet.
    expect(styleNodeCount()).toBe(1)

    second.dispose()
    first.dispose()
    expect(styleNodeCount()).toBe(0)
    expect(ownedNodeCount()).toBe(0)
    expect(themeAttributeCount()).toBe(0)
  })

  it('7. re-initialises cleanly after disposal, with no stale listeners', () => {
    const first = createHarness()
    apply(first.ctx)
    first.dispose()

    expect(styleNodeCount()).toBe(0)
    expect(themeAttributeCount()).toBe(0)

    // A disposed instance must no longer react to settings changes.
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT))
    expect(document.body.hasAttribute('data-dsh-taffy-theme')).toBe(false)

    const second = createHarness()
    apply(second.ctx)
    expect(styleNodeCount()).toBe(1)

    second.dispose()
    expect(styleNodeCount()).toBe(0)
  })

  it('5 + 8. a mid-init failure stays inert and leaves the native UI untouched', () => {
    // Fail deep inside ensureChrome(), after the style node, the theme tokens
    // and part of the chrome already exist.
    defineGlobal('ResizeObserver', class {
      constructor() {
        throw new Error('ResizeObserver unavailable in this environment')
      }
    })

    const harness = createHarness()
    expect(() => apply(harness.ctx)).not.toThrow()

    // The failure is reported, not swallowed silently.
    expect(console.error).toHaveBeenCalled()

    // No leftovers: sheet, chrome, theme attributes and the <html> marker.
    expect(styleNodeCount()).toBe(0)
    expect(ownedNodeCount()).toBe(0)
    expect(themeAttributeCount()).toBe(0)
    expect(document.documentElement.hasAttribute('data-dsh-taffy-theme')).toBe(false)

    // The native UI still works and nothing reacts to events any more.
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT))
    expect(document.body.hasAttribute('data-dsh-taffy-theme')).toBe(false)
  })
})
