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

  it('cannot hide native rail icons at any level, because the rules are gone', () => {
    // The patch gated those rules behind [data-taffy-sidebar-ornate]; the
    // follow-up removed them outright, which is stronger: no level, now or
    // later, can hide a native icon.
    expect(css).not.toMatch(/data-taffy-sidebar-ornate[^{}]*button/)
  })

  it('no longer generates a brand heading or a 56px brand avatar', () => {
    expect(css).not.toContain("content: 'taffy-harness'")
    expect(css).not.toMatch(/button\[class\*='brand'\][^{}]*\{[^}]*width:\s*56px/)
    expect(css).not.toMatch(/button\[class\*='brand'\][^{}]*\{[^}]*font-size:\s*0/)
  })
})
