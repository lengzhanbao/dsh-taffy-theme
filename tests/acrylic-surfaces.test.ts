import { afterEach, describe, expect, it } from 'vitest'
import { startAcrylicSurfaces } from '../src/client/acrylic-surfaces.ts'

describe('acrylic surfaces', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('does not auto-mark overlay children, details, or floating panels', () => {
    const overlay = document.createElement('div')
    overlay.setAttribute('data-shell-overlay', '')
    const panel = document.createElement('div')
    overlay.append(panel)
    const details = document.createElement('div')
    details.setAttribute('data-pane', 'details')
    const floating = document.createElement('div')
    floating.setAttribute('data-dsh-floating-panel', '')
    const cordis = document.createElement('div')
    cordis.setAttribute('data-cordis-panel', '')
    document.body.append(overlay, details, floating, cordis)

    const dispose = startAcrylicSurfaces(document)
    expect(panel.hasAttribute('data-taffy-surface')).toBe(false)
    expect(details.hasAttribute('data-taffy-surface')).toBe(false)
    expect(floating.hasAttribute('data-taffy-surface')).toBe(false)
    expect(cordis.hasAttribute('data-taffy-surface')).toBe(false)
    dispose()
  })

  it('leaves plugin-declared surfaces untouched', () => {
    const panel = document.createElement('div')
    panel.setAttribute('data-plugin-root', 'example')
    panel.setAttribute('data-taffy-surface', 'acrylic')
    document.body.append(panel)

    const dispose = startAcrylicSurfaces(document)
    expect(panel.getAttribute('data-taffy-surface')).toBe('acrylic')
    expect(panel.hasAttribute('data-taffy-surface-owner')).toBe(false)
    dispose()
    expect(panel.getAttribute('data-taffy-surface')).toBe('acrylic')
  })

  it('clears leftover owner attributes from older builds', () => {
    const panel = document.createElement('div')
    panel.setAttribute('data-taffy-surface', 'acrylic')
    panel.setAttribute('data-taffy-surface-owner', 'dsh-taffy-theme')
    document.body.append(panel)

    const dispose = startAcrylicSurfaces(document)
    expect(panel.hasAttribute('data-taffy-surface')).toBe(false)
    expect(panel.hasAttribute('data-taffy-surface-owner')).toBe(false)
    dispose()
  })
})
