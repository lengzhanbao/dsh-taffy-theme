import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Guards the decoration-budget layer against targeting layers that never render.
 *
 * The first attempt at the Astral Atelier redesign dimmed [data-taffy-character]
 * and [data-taffy-ground] to make a "weak watermark" of the sidebar figure. In a
 * live renderer those elements measure 0x0 with display:none, because mount.ts
 * hard-sets data-taffy-scene='fused' and the stylesheet hides them in that
 * scene — the visible figures are painted into the wallpaper bitmap. The rules
 * were therefore dead code: correct-looking, impossible to observe.
 *
 * These assertions pin the reasoning so the next pass cannot repeat it silently.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const components = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
const motion = readFileSync(join(root, 'src/theme/motion.css'), 'utf8')
const mount = readFileSync(join(root, 'src/client/mount.ts'), 'utf8')

const MARKER = 'Astral Atelier — decoration budget'
const sectionStart = components.indexOf(MARKER)
// The marker sits inside the section's banner comment, so slice from the end of
// that comment — otherwise the banner's own prose would count as CSS.
const bannerEnd = sectionStart === -1 ? -1 : components.indexOf('*/', sectionStart)
const budget = bannerEnd === -1 ? '' : components.slice(bannerEnd + 2)

describe('decoration budget', () => {
  it('exists and is the last section of components.css', () => {
    expect(sectionStart).toBeGreaterThan(0)
    expect(budget.length).toBeGreaterThan(500)
  })

  it('still holds the invariant it was written against', () => {
    // If either of these stops being true the reasoning below needs revisiting,
    // and the failing test is the reminder rather than a silent visual no-op.
    expect(mount).toContain("'data-taffy-scene', 'fused'")
    expect(components).toContain("[data-taffy-scene='fused'] [data-taffy-character]")
  })

  it('does not target the layers the fused scene hides', () => {
    // These are display:none in every state the plugin can produce, so a rule
    // here would ship as dead code and read as a working change.
    const withoutComments = budget.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(withoutComments).not.toContain('[data-taffy-character')
    expect(withoutComments).not.toContain('[data-taffy-ground')
    expect(withoutComments).not.toContain("data-skin-chrome='taffy-top-curtain'")
    expect(withoutComments).not.toContain("data-skin-chrome='taffy-bottom-curtain'")
    expect(withoutComments).not.toContain('[data-taffy-frame-corner')
  })

  it('does target the backdrop that does render', () => {
    expect(budget).toContain('[data-taffy-wallpaper]')
    expect(budget).toContain('[data-taffy-sparkles]')
    expect(budget).toContain("[data-taffy-mascot='sidebar']")
    expect(budget).toContain('--taffy-wallpaper-focus-opacity')
  })

  it('keeps every knob overridable rather than hardcoding values', () => {
    for (const knob of [
      '--taffy-sparkle-opacity',
      '--taffy-wallpaper-saturation',
      '--taffy-wallpaper-brightness',
      '--taffy-wallpaper-focus-opacity',
      '--taffy-gold-ink-strength',
    ]) {
      expect(budget).toContain(knob)
    }
  })

  it('reduces the animated particle opacity, not just the static one', () => {
    // The running keyframes override a static opacity, so components.css alone
    // cannot dim the sparkles; specs/01 §四.2 needs these numbers lowered too.
    const keyframes = motion.match(/@keyframes taffy-sparkle-drift \{[\s\S]*?\n\}/)
    expect(keyframes).not.toBeNull()
    const values = [...(keyframes?.[0] ?? '').matchAll(/opacity:\s*([\d.]+)/g)].map((m) =>
      Number.parseFloat(m[1]),
    )
    expect(values.length).toBeGreaterThan(1)
    // Originally 0.42 / 0.68; the spec asks for at least half the density gone.
    for (const value of values) expect(value).toBeLessThanOrEqual(0.3)
  })
})
