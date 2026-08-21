import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../src/config.ts'
import { shouldUseLowPower } from '../src/client/performance.ts'

describe('shouldUseLowPower', () => {
  it('enables when reduced motion is requested', () => {
    expect(shouldUseLowPower({ ...DEFAULT_SETTINGS, reducedMotion: true })).toBe(true)
  })

  it('enables when motion is off', () => {
    expect(shouldUseLowPower({ ...DEFAULT_SETTINGS, motion: 'off', reducedMotion: false })).toBe(true)
  })

  it('stays off for the default candy profile', () => {
    expect(shouldUseLowPower(DEFAULT_SETTINGS)).toBe(false)
  })
})
