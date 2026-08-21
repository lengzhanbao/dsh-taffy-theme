import { describe, expect, it } from 'vitest'
import { ASSET_SET_VERSION, buildAssetUrl } from '../src/assets/manifest.ts'
import { isAllowedImageProtocol, isSafeCssColor, isWithinByteLimit } from '../src/assets/validate.ts'

describe('asset validation', () => {
  it('accepts safe colors only', () => {
    expect(isSafeCssColor('#ff72c6')).toBe(true)
    expect(isSafeCssColor('red; background: url(evil)')).toBe(false)
  })

  it('cache-busts bundled asset URLs so refresh is not required', () => {
    const url = buildAssetUrl('wallpaper-light.webp')
    expect(url).toContain('/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/wallpaper-light.webp')
    expect(url).toContain(`?v=${ASSET_SET_VERSION}`)
    expect(isAllowedImageProtocol(url)).toBe(true)
  })

  it('validates image protocols', () => {
    expect(isAllowedImageProtocol('/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/generated/avatar.webp')).toBe(true)
    expect(isAllowedImageProtocol('javascript:alert(1)')).toBe(false)
    expect(isAllowedImageProtocol('')).toBe(false)
  })

  it('checks byte limits', () => {
    expect(isWithinByteLimit(1024, 2048)).toBe(true)
    expect(isWithinByteLimit(999999, 2048)).toBe(false)
  })
})
