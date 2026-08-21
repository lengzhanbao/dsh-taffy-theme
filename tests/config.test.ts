import { describe, expect, it } from 'vitest'
import { PluginConfig, DEFAULT_SETTINGS, parseTaffySettings } from '../src/config.ts'

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
})
