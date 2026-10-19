import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const components = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
const bundledQ = readFileSync(join(root, 'src/client/bundled-q.ts'), 'utf8')
const icons = join(root, 'assets/taffy/icons')

describe('Taffy headshot icons', () => {
  it('ships square headshots and resolves them via plugin asset URLs', () => {
    const bundledQ = readFileSync(join(root, 'src/client/bundled-q.ts'), 'utf8')
    for (const name of ['face-look', 'face-happy', 'face-stop', 'face-portrait', 'face-wink', 'face-new', 'face-pet']) {
      expect(existsSync(join(icons, `${name}.webp`)), name).toBe(true)
      expect(existsSync(join(icons, `${name}.png`)), name).toBe(true)
    }
    expect(bundledQ).toContain("buildAssetUrl('icons/face-look.webp')")
    expect(bundledQ).toContain("buildAssetUrl('icons/face-happy.webp')")
    expect(bundledQ).toContain("buildAssetUrl('icons/face-stop.webp')")
    expect(bundledQ).toContain("buildAssetUrl('icons/face-wink.webp')")
    expect(bundledQ).toContain("buildAssetUrl('icons/face-new.webp')")
    expect(bundledQ).toContain("buildAssetUrl('icons/face-portrait.webp')")
    expect(bundledQ).toContain("buildAssetUrl('icons/face-pet.webp')")
    expect(bundledQ).toContain('BUNDLED_Q_BRAND_RIGHT')
    expect(bundledQ).not.toContain('data:image/')
  })


  it('fills the composer Q faces at 118–122% and keeps them decorative', () => {
    for (const label of ['发送消息', '停止生成', '命令']) {
      expect(components).toMatch(
        new RegExp(`\\[data-composer-card\\] button\\[aria-label='${label}'\\]::after[\\s\\S]{0,220}background-size:\\s*122% 122%`),
      )
    }
    expect(components).toContain('--taffy-q-send')
    // The overlay must never intercept a click meant for the button.
    expect(components).toMatch(/:after[\s\S]{0,200}pointer-events:\s*none/)
  })

  it('no longer sizes or replaces the native sidebar controls', () => {
    // Everything below belonged to the pre-2026-10-19 "ornate" treatment. It was
    // deleted rather than overridden, so these guards assert absence.
    expect(components).not.toContain("content: 'taffy-harness'")
    expect(components).not.toMatch(/width:\s*36px/)
    expect(components).not.toMatch(/width:\s*56px/)
    expect(components).not.toMatch(/min-height:\s*64px/)
    expect(components).not.toContain('padding: 11px 16px 17px')
    expect(components).not.toMatch(/data-taffy-sidebar-ornate[^{}]*button/)
    // The composer keeps its round Q buttons; the sidebar does not.
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='发送消息'\][\s\S]{0,900}border-radius:\s*50%/)
    expect(components).not.toMatch(/\[data-slot='sidebar\.settings'\][^{}]*\{[^}]*border-radius:\s*50%/)
  })


  it('replaces the hero fish with a round avatar and pink-gold headline', () => {
    const badges = readFileSync(join(root, 'src/theme/taffy-badges.css'), 'utf8')
    expect(badges).toContain('var(--taffy-hero-avatar) center / cover no-repeat')
    expect(badges).toMatch(/headlineText[\s\S]{0,500}background-clip:\s*text/)
    expect(badges).toMatch(/linear-gradient\([\s\S]{0,180}#c99a27[\s\S]{0,120}#b8860b/)
  })
})
