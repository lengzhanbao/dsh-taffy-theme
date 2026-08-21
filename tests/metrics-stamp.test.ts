import { describe, expect, it, vi } from 'vitest'
import {
  metricsStampingEnabled,
  readMetricsFromBody,
  selectorMisses,
  stampMetrics,
} from '../src/client/metrics-stamp'
import { STYLE_ID } from '../src/client/styles'

describe('metrics-stamp', () => {
  it('writes JSON metrics onto the style node', () => {
    const doc = document.implementation.createHTMLDocument('metrics')
    const body = doc.body
    body.setAttribute('data-dsh-taffy-theme', '')
    const style = doc.createElement('style')
    style.id = STYLE_ID
    doc.head.append(style)

    stampMetrics(doc, body, 'test')
    const raw = style.getAttribute('data-taffy-metrics')
    expect(raw).toBeTruthy()
    const payload = JSON.parse(raw ?? '{}') as ReturnType<typeof readMetricsFromBody>
    expect(payload.scene).toBe('test')
    expect(payload.enabled).toBe(true)
    expect(Array.isArray(payload.selectorMisses)).toBe(true)
  })

  it('detects missing shell selectors in jsdom', () => {
    const doc = document.implementation.createHTMLDocument('miss')
    const misses = selectorMisses(doc)
    expect(misses).toContain('SIDEBAR_SELECTOR')
    expect(misses).toContain('COMPOSER_CARD_SELECTOR')
  })

  it('can opt out via localStorage flag', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
    })
    try {
      localStorage.setItem('dsh-taffy-theme:metrics', '0')
      expect(metricsStampingEnabled()).toBe(false)
      localStorage.removeItem('dsh-taffy-theme:metrics')
      expect(metricsStampingEnabled()).toBe(true)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
