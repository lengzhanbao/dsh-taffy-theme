import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { STYLE_ID, ensureStyleNode } from '../src/client/styles.ts'
import { startAcrylicSurfaces } from '../src/client/acrylic-surfaces.ts'
import { removeOwnedChrome } from '../src/client/mount.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const themeDir = join(root, 'src/theme')
const themeCss = readdirSync(themeDir)
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(join(themeDir, file), 'utf8'))
  .join('\n')
const acrylic = readFileSync(join(root, 'src/client/acrylic-surfaces.ts'), 'utf8')
const backdrop = readFileSync(join(root, 'src/client/backdrop.ts'), 'utf8')
const mount = readFileSync(join(root, 'src/client/mount.ts'), 'utf8')
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string }
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
const hostSrc = readFileSync(join(root, 'src/index.ts'), 'utf8')
const clientSrc = readFileSync(join(root, 'src/client/index.ts'), 'utf8')

describe('plugin isolation', () => {
  it('never auto-scans host overlays or third-party panels', () => {
    expect(acrylic).not.toContain("[data-pane='details']")
    expect(acrylic).not.toContain('[data-dsh-better-sidebar]')
    expect(acrylic).not.toContain('[data-cordis-panel]')
    expect(acrylic).not.toContain('[data-dsh-floating-panel]')
    expect(acrylic).not.toContain('[data-shell-overlay]')
    expect(themeCss).not.toContain('[data-shell-overlay] > *')
    expect(themeCss).not.toMatch(/^body \*$/m)
    expect(themeCss).not.toContain('#root *')
    expect(themeCss).not.toMatch(/\[class\*='panel'\]/)
  })

  it('keeps veil and centerCol translucent enough for wallpaper', () => {
    expect(themeCss).toMatch(/--taffy-veil-strength:\s*0\.1[28]/)
    expect(themeCss).not.toMatch(/--taffy-veil-strength:\s*0\.[3-9]/)
    expect(themeCss).toContain('rgba(255, 247, 241, 0.16)')
    expect(themeCss).toContain('rgba(33, 27, 50, 0.22)')
    expect(themeCss).toContain(":has(> [class*='sidebarCol']):has(> [class*='centerCol'])")
  })

  it('does not paint an opaque page fill from backdrop runtime', () => {
    expect(backdrop).not.toContain('linear-gradient(180deg')
    expect(backdrop).not.toContain("body.style.background")
    expect(mount).not.toContain("'background'")
  })

  it('does not hide the sidebar mascot and uses distinct character attrs', () => {
    expect(themeCss).not.toContain("[data-skin-chrome='sidebar-mascot']")
    expect(mount).toContain("dataset.taffyCharacter = character")
    expect(mount).toContain("dataset.taffyMascot = 'sidebar'")
    expect(mount).not.toContain("sidebar-mascot")
  })

  it('registers the same package id on host, client, and style node', () => {
    expect(packageJson.name).toBe('@dsh-external/dsh-taffy-theme')
    expect(hostSrc).toContain("export const name = '@dsh-external/dsh-taffy-theme'")
    expect(clientSrc).toContain("export const name = '@dsh-external/dsh-taffy-theme'")
    expect(STYLE_ID).toBe('dsh-taffy-theme-style')
    expect(patch).toContain("name: '@dsh-external/dsh-taffy-theme'")
    expect(patch).not.toContain('@file:')
  })

  it('does not delete foreign chrome on dispose', () => {
    const foreign = document.createElement('div')
    foreign.setAttribute('data-skin-chrome', 'atelier-frame')
    foreign.setAttribute('data-skin-owner', 'someone-else')
    const owned = document.createElement('div')
    owned.setAttribute('data-skin-chrome', 'atelier-frame')
    owned.setAttribute('data-skin-owner', 'dsh-taffy-theme')
    document.body.append(foreign, owned)
    removeOwnedChrome(document)
    expect(document.body.contains(foreign)).toBe(true)
    expect(document.body.contains(owned)).toBe(false)
    foreign.remove()
  })

  it('HMR reuses a single style node', () => {
    const doc = document.implementation.createHTMLDocument('hmr')
    ensureStyleNode(doc)
    ensureStyleNode(doc)
    expect(doc.querySelectorAll('#dsh-taffy-theme-style')).toHaveLength(1)
  })

  it('leaves undeclared plugin roots unmarked', () => {
    const plugin = document.createElement('div')
    plugin.setAttribute('data-plugin-root', 'other')
    document.body.append(plugin)
    const dispose = startAcrylicSurfaces(document)
    expect(plugin.hasAttribute('data-taffy-surface')).toBe(false)
    dispose()
    plugin.remove()
  })

  it('does not restyle terminal, code, or generic buttons', () => {
    expect(themeCss).not.toContain('!important')
    expect(themeCss).not.toContain('clip-path')
    expect(themeCss).not.toContain('body button')
    expect(themeCss).not.toContain('[data-terminal')
    expect(themeCss).not.toContain('[data-code')
    expect(clientSrc).not.toContain("removeProperty('background')")
    expect(backdrop).not.toContain("removeProperty('background')")
  })
})

describe('workspace boundaries', () => {
  it('does not contain Taffy hooks in DSH core source files', () => {
    const checkout = process.env.DSH_CHECKOUT ?? 'E:/DeepSeekHarness/src/deepseek-harness'
    const files = [
      join(checkout, 'packages/client/ui-layout/src/client/AppFrame.tsx'),
      join(checkout, 'packages/client/ui-theme/src/index.ts'),
      join(checkout, 'packages/client/runtime/src/index.ts'),
      join(checkout, 'packages/client/ui-settings/src/index.ts'),
    ]
    for (const file of files) {
      if (!existsSync(file)) continue
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/dsh-taffy-theme|data-taffy-/)
    }
  })
})
