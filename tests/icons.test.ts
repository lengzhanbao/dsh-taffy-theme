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

  it('keeps new-session at 36px, collapse at 48px, DS brand at 56px, and fills Q faces at 118–122%', () => {
    expect(components).toContain("button[aria-label='发送消息']")
    expect(components).toContain("button[aria-label='收起侧边栏']")
    expect(components).toContain("content: 'taffy-harness'")
    expect(components).toContain("button[class*='brand']::after")
    expect(components).not.toContain('padding-right: 66px')
    expect(components).toMatch(/收起侧边栏'\]::after[\s\S]{0,400}--taffy-q-brand-right/)
    expect(components).toContain('width: 36px')
    expect(components).toContain('min-width: 36px')
    expect(components).toContain('width: 42px')
    expect(components).toContain('width: 44px')
    expect(components).toContain('width: 48px')
    expect(components).toContain('width: 56px')
    expect(components).toContain('background-size: 118% 118%')
    expect(components).toContain('background-size: 122% 122%')
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='发送消息'\][\s\S]{0,900}border-radius:\s*50%/)
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='发送消息'\]::after[\s\S]{0,220}background-size:\s*122% 122%/)
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='停止生成'\]::after[\s\S]{0,220}background-size:\s*122% 122%/)
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='命令'\]::after[\s\S]{0,220}background-size:\s*122% 122%/)
    expect(components).not.toContain('width: 52px')
  })

  it('uses a full-width plate for wide settings with visible label', () => {
    expect(components).toContain(":not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog']")
    expect(components).toContain(":not([data-taffy-sidebar-size='rail']) [data-slot='sidebar.settings'] button[aria-haspopup='dialog']::before")
    const plate = components.match(
      /:not\(\[data-taffy-sidebar-size='rail'\]\) \[data-slot='sidebar.settings'\] button\[aria-haspopup='dialog'\],[\s\S]*?\n\}/,
    )
    expect(plate?.[0]).toContain('width: 100%')
    expect(plate?.[0]).toContain('font-size: 14px')
    expect(plate?.[0]).toContain('background: var(--taffy-plate-art)')
    expect(plate?.[0]).toContain('border-radius: 14px')
    expect(plate?.[0]).not.toContain('border-image-source')
    expect(plate?.[0]).not.toMatch(/font-size:\s*0/)
    expect(plate?.[0]).not.toContain('color: transparent')
    expect(plate?.[0]).not.toMatch(/border-radius:\s*50%/)
    const rail = components.match(
      /\[data-taffy-sidebar-size='rail'\] \[data-slot='sidebar.settings'\] button\[aria-haspopup='dialog'\] \{[\s\S]*?\n\}/,
    )
    expect(rail?.[0]).toContain('border-radius: 50%')
    expect(rail?.[0]).toContain('font-size: 0')
    expect(rail?.[0]).toContain('overflow: visible')
  })

  it('does not round labeled new-session or settings rows', () => {
    expect(components).toContain(":not([data-taffy-sidebar-size='rail']) :is([data-pane='sidebar'], [class*='sidebarCol']) button[aria-label='新建会话']:not([class*='brand'])")
    const labeled = components.match(
      /:not\(\[data-taffy-sidebar-size='rail'\]\) \[data-slot='sidebar.settings'\] button\[aria-haspopup='dialog'\],[\s\S]*?\n\}/,
    )
    expect(labeled?.[0]).toContain('min-height: 56px')
    expect(labeled?.[0]).not.toMatch(/border-radius:\s*50%/)
    expect(components).not.toMatch(/button\[class\*='brand'\] \{[\s\S]{0,200}border-radius:\s*50%/)
  })

  it('hides native SVG only after the headshot is ready', () => {
    expect(components).toContain('[data-taffy-q-ready]')
    expect(components).not.toMatch(/^body svg/m)
    expect(components).not.toContain('clip-path')
    expect(components).toContain("[data-slot='sidebar.settings'] button[aria-haspopup='dialog'] svg")
    expect(components).not.toContain("[data-slot='sidebar.settings'] button[aria-haspopup='dialog'] > svg")
  })

  it('replaces the hero fish with a round avatar and pink-gold headline', () => {
    const badges = readFileSync(join(root, 'src/theme/taffy-badges.css'), 'utf8')
    expect(badges).toContain('var(--taffy-hero-avatar) center / cover no-repeat')
    expect(badges).toMatch(/headlineText[\s\S]{0,400}background-clip:\s*text/)
    expect(badges).toMatch(/linear-gradient\([\s\S]{0,180}#c99a27[\s\S]{0,120}#b8860b/)
  })
})
