import { describe, expect, it } from 'vitest'
import { applyImageSrc, bindAssetFallback } from '../src/client/mount.ts'

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

describe('character asset recovery', () => {
  it('clears data-taffy-asset-error when src is restored', () => {
    const image = document.createElement('img')
    bindAssetFallback(image)
    image.dispatchEvent(new Event('error'))
    expect(image.hasAttribute('data-taffy-asset-error')).toBe(true)

    applyImageSrc(image, PIXEL)
    expect(image.hasAttribute('data-taffy-asset-error')).toBe(false)
    expect(image.getAttribute('src')).toBe(PIXEL)
  })

  it('clears data-taffy-asset-error on a successful load after error', () => {
    const image = document.createElement('img')
    bindAssetFallback(image)
    image.dispatchEvent(new Event('error'))
    expect(image.hasAttribute('data-taffy-asset-error')).toBe(true)

    image.dispatchEvent(new Event('load'))
    expect(image.hasAttribute('data-taffy-asset-error')).toBe(false)
  })

  it('swaps to a fallback portrait instead of staying hidden', () => {
    const image = document.createElement('img')
    bindAssetFallback(image, PIXEL)
    image.src = 'about:blank'
    image.dispatchEvent(new Event('error'))
    expect(image.hasAttribute('data-taffy-asset-error')).toBe(false)
    expect(image.getAttribute('src')).toBe(PIXEL)
  })
})
