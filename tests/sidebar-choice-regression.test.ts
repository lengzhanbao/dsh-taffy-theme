import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = process.cwd()
const panel = readFileSync(join(root, 'src/client/settings-panel.ts'), 'utf8')
const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8')

describe('desktop sidebar decoration controls', () => {
  it('uses three-state segmented controls instead of large generic cubes', () => {
    expect(panel).toContain("className: 'dsh-taffy-choice-group'")
    expect(panel).toContain('dsh-taffy-choice')
    expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
  })

  it('does not hide the native rail icons in off/simple modes', () => {
    expect(css).toContain("[data-taffy-sidebar-ornate][data-taffy-q-ready][data-taffy-sidebar-size='rail']")
    expect(css).not.toContain("body[data-dsh-taffy-theme][data-taffy-q-ready][data-taffy-sidebar-size='rail'] [data-slot='sidebar.settings'] button[aria-haspopup='dialog'] svg")
  })

  it('restores the brand icon/text rather than generating a large 56px heading', () => {
    expect(css).toContain("button[class*='brand']::after")
    expect(css).toContain('content: none;')
  })
})
