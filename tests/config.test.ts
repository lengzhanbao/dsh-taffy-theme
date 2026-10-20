import { describe, expect, it } from 'vitest'
import { PluginConfig, DEFAULT_SETTINGS, DEFAULT_SIDEBAR_WATERMARK_STRENGTH, parseTaffySettings } from '../src/config.ts'
import { sidebarWatermarkOpacity } from '../src/client/mount.ts'

describe('host config', () => {
  it('exposes Cordis-compatible empty schema', () => {
    expect(PluginConfig['~standard']?.validate).toBeTypeOf('function')
    const result = PluginConfig['~standard'].validate({})
    expect(result.issues).toBeUndefined()
    expect(result.value).toEqual({})
  })

  it('merges browser settings with defaults', () => {
    const parsed = parseTaffySettings({ enabled: false, displayName: '塔菲' })
    expect(parsed.enabled).toBe(false)
    expect(parsed.displayName).toBe('塔菲')
    expect(parsed.colors.preset).toBe(DEFAULT_SETTINGS.colors.preset)
  })

  it('keeps the taffy hero headline as the default and allows overrides', () => {
    expect(DEFAULT_SETTINGS.heroHeadline).toBe('关注塔菲喵！关注塔菲谢谢喵！')
    expect(parseTaffySettings({ heroHeadline: '喵呜' }).heroHeadline).toBe('喵呜')
  })

  it('migrates existing watermark choices and clamps the independent visibility setting', () => {
    const old = parseTaffySettings({ sidebarWatermark: 'celestial-sidebar', sidebarDecoration: 'off' })
    expect(old.sidebarWatermark).toBe('celestial-sidebar')
    expect(old.sidebarDecoration).toBe('off')
    expect(old.sidebarWatermarkStrength).toBe(DEFAULT_SIDEBAR_WATERMARK_STRENGTH)
    expect(sidebarWatermarkOpacity(old.sidebarWatermarkStrength)).toBeCloseTo(0.39)
    expect(parseTaffySettings({ sidebarWatermarkStrength: -4 }).sidebarWatermarkStrength).toBe(0)
    expect(parseTaffySettings({ sidebarWatermarkStrength: 123 }).sidebarWatermarkStrength).toBe(100)
  })

  it('makes watermark opacity rise at each slider checkpoint', () => {
    const levels = [0, 25, 50, 75, 100].map(sidebarWatermarkOpacity)
    expect(levels[0]).toBe(0)
    expect(levels[4]).toBe(0.65)
    for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeGreaterThan(levels[i - 1])
    const lightLevels = [0, 25, 50, 75, 100].map((value) => sidebarWatermarkOpacity(value, false))
    expect(lightLevels[4]).toBe(0.4)
    for (let i = 1; i < lightLevels.length; i++) expect(lightLevels[i]).toBeGreaterThan(lightLevels[i - 1])
  })
})
