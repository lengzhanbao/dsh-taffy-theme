import { describe, expect, it } from 'vitest'
import { applyThemeTokens, resolveThemeTokens, restoreThemeTokens, snapshotThemeTokens } from '../src/theme/user-theme.ts'

describe('user theme', () => {
  it('returns candy preset from character art', () => {
    const tokens = resolveThemeTokens({
      preset: 'taffy-candy',
      dynamicEnabled: true,
      dynamicIntensity: 'standard',
    })
    expect(tokens.primary).toBe('#f29bc2')
    expect(tokens.accent).toBe('#e7b957')
    expect(tokens.secondary).toBe('#493b50')
  })

  it('rejects unsafe custom colors', () => {
    const tokens = resolveThemeTokens({
      preset: 'custom',
      primary: 'url(javascript:alert(1))',
      dynamicEnabled: true,
      dynamicIntensity: 'standard',
    })
    expect(tokens.primary).toBe('#f29bc2')
  })

  it('preserves official dsw tokens already on the root', () => {
    const root = document.createElement('div')
    root.style.setProperty('--dsw-alias-bg-base', 'rgb(249, 250, 251)')
    root.style.setProperty('--dsw-alias-label-primary', '#3a322e')
    applyThemeTokens(root, resolveThemeTokens({
      preset: 'taffy-candy',
      dynamicEnabled: true,
      dynamicIntensity: 'standard',
    }))
    expect(root.style.getPropertyValue('--dsw-alias-bg-base')).toBe('rgb(249, 250, 251)')
    expect(root.style.getPropertyValue('--dsw-alias-label-primary')).toBe('#3a322e')
    expect(root.style.getPropertyValue('--ds-taffy-pink')).toBe('#f29bc2')
  })

  it('restores taffy tokens captured before apply', () => {
    const root = document.createElement('div')
    root.style.setProperty('--ds-taffy-pink', '#111111')
    const snapshot = snapshotThemeTokens(root)
    applyThemeTokens(root, resolveThemeTokens({
      preset: 'taffy-candy',
      dynamicEnabled: true,
      dynamicIntensity: 'standard',
    }))
    expect(root.style.getPropertyValue('--ds-taffy-pink')).toBe('#f29bc2')
    restoreThemeTokens(root, snapshot)
    expect(root.style.getPropertyValue('--ds-taffy-pink')).toBe('#111111')
  })

  it('uses light copy for the night preset', () => {
    const tokens = resolveThemeTokens({
      preset: 'taffy-night',
      dynamicEnabled: true,
      dynamicIntensity: 'standard',
    })
    expect(tokens.text).toBe('#fff4fa')
  })
})
