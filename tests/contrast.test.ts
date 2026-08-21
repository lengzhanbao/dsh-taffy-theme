import { describe, expect, it } from 'vitest'
import { contrastRatio, meetsTextContrast } from '../src/theme/contrast.ts'

describe('contrast', () => {
  it('computes contrast ratio for hex colors', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThan(10)
  })

  it('rejects invalid hex colors', () => {
    expect(() => contrastRatio('white', '#000000')).toThrow(/Invalid hex color/)
    expect(() => contrastRatio('#fff', '#0000008f')).toThrow(/Invalid hex color/)
    expect(meetsTextContrast('white', '#000000')).toBe(false)
  })

  it('enforces text contrast threshold', () => {
    expect(meetsTextContrast('#f8f7ff', '#090b18')).toBe(true)
    expect(meetsTextContrast('#777777', '#888888')).toBe(false)
  })

  it('keeps night labels readable on observatory charcoal', () => {
    expect(meetsTextContrast('#fff3e8', '#211b32')).toBe(true)
    expect(meetsTextContrast('#fff3e8', '#181326')).toBe(true)
  })

  it('keeps daylight ink readable on cream', () => {
    expect(meetsTextContrast('#141018', '#fffdfb')).toBe(true)
    expect(meetsTextContrast('#141018', '#fff7f1')).toBe(true)
  })
})
