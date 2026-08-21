import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const components = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
const build = readFileSync(join(root, 'scripts/build.ps1'), 'utf8')
const icons = join(root, 'assets/taffy/icons')

describe('Taffy headshot icons', () => {
  it('bundles square headshots instead of full-body or caption stickers', () => {
    for (const name of ['face-look', 'face-happy', 'face-stop', 'face-portrait', 'face-wink', 'face-new']) {
      expect(existsSync(join(icons, `${name}.webp`)), name).toBe(true)
      expect(existsSync(join(icons, `${name}.png`)), name).toBe(true)
    }
    expect(build).toContain("assets/taffy/icons/")
    expect(build).toContain("q('face-look'")
    expect(build).toContain("q('face-happy'")
    expect(build).toContain("q('face-stop'")
    expect(build).toContain("q('face-wink'")
    expect(build).toContain("q('face-new'")
    expect(build).not.toContain("q('taffy-01'")
    expect(build).not.toContain("q('taffy-04'")
    expect((build.match(/q\('face-look'/g) ?? []).length).toBe(1)
  })

  it('keeps sidebar and new-session at 36px / 82%, and fills settings and send at 98%', () => {
    expect(components).toContain("button[aria-label='发送消息']")
    expect(components).toContain("button[aria-label='收起侧边栏']")
    expect(components).toContain('width: 36px')
    expect(components).toContain('min-width: 36px')
    expect(components).toContain('width: 42px')
    expect(components).toContain('width: 44px')
    expect(components).toContain('background-size: 82% 82%')
    expect(components).toContain('background-size: 98% 98%')
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='发送消息'\][\s\S]{0,900}border-radius:\s*50%/)
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='发送消息'\]::after[\s\S]{0,220}background-size:\s*98% 98%/)
    expect(components).toMatch(/\[data-composer-card\] button\[aria-label='停止生成'\]::after[\s\S]{0,220}background-size:\s*98% 98%/)
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
    expect(plate?.[0]).toContain('overflow: visible')
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
    expect(components).not.toMatch(/button\[class\*='brand'\][\s\S]{0,200}border-radius:\s*50%/)
  })

  it('hides native SVG only after the headshot is ready', () => {
    expect(components).toContain('[data-taffy-q-ready]')
    expect(components).not.toMatch(/^body svg/m)
    expect(components).not.toContain('clip-path')
    expect(components).toContain("[data-slot='sidebar.settings'] button[aria-haspopup='dialog'] svg")
    expect(components).not.toContain("[data-slot='sidebar.settings'] button[aria-haspopup='dialog'] > svg")
  })
})
