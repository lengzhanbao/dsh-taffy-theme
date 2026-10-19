import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { chatLookDefaults, parseTaffySettings } from '../src/config.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

describe('chat look: anchors', () => {
  it('scopes the user bubble to the host attribute, not a hashed class', () => {
    expect(css).toContain("[data-chat-flow-kind='user']")
    // The bubble element's own class is a CSS-module hash; only the optional
    // border may rely on its stable local suffix, and only under the anchor.
    expect(css).toMatch(/\[data-taffy-bubble-border='subtle'\] \[data-chat-flow-kind='user'\] \[class\*='_bubble'\]/)
    expect(css).not.toMatch(/^\.\w+_bubble\s*\{/m)
  })

  it('rides on the host tokens instead of inventing element selectors', () => {
    expect(css).toContain('--dsw-specific-bubble')
    expect(css).toContain('--dsw-radius-xl')
    expect(css).toContain('--dsh-chat-content-width')
  })

  it('never fades the bubble itself, only its background', () => {
    const bubbleRules = css
      .split('\n')
      .filter((line) => line.includes('[data-taffy-bubble=') || line.includes('--taffy-bubble-opacity'))
      .join('\n')
    expect(bubbleRules).not.toMatch(/(^|[;{\s])opacity\s*:\s*[\d.]/)
  })

  it('does not touch assistant, tool or markdown containers', () => {
    for (const forbidden of ['markdown', 'code-block', 'tool-card', 'chat-flow-kind=\'assistant\'']) {
      expect(css.includes(`[data-chat-flow-kind='user'] ${forbidden}`), forbidden).toBe(false)
    }
  })
})

describe('chat look: composer decoration', () => {
  it('gates the filigree on the full level by editing the source rules', () => {
    expect(css).toContain("[data-taffy-composer-decor='full'] [data-composer-card]::before")
    expect(css).toContain("[data-taffy-composer-decor='full'] [data-composer-card]::after")
    // i.e. no unconditional version is left behind
    expect(css).not.toMatch(/^body\[data-dsh-taffy-theme\] \[data-composer-card\]::(before|after) \{/m)
  })

  it('keeps off and low as explicit, separate looks', () => {
    expect(css).toContain("[data-taffy-composer-decor='low'] [data-composer-card]")
    expect(css).toContain("[data-taffy-composer-decor='off'] [data-composer-card]")
  })
})

describe('chat look: migration', () => {
  it('leaves an existing install exactly as it looks today', () => {
    const existing = { schemaVersion: 1, enabled: true, displayName: 'x' }
    const got = chatLookDefaults(existing)
    expect(got.userBubbleStyle).toBe('native')
    expect(got.userBubbleBorder).toBe('off')
    expect(got.composerStyle).toBe('native')
    expect(got.composerDecoration).toBe('full')
  })

  it('gives a fresh install the intended new look', () => {
    const got = chatLookDefaults({})
    expect(got.userBubbleStyle).toBe('glass')
    expect(got.userBubbleBorder).toBe('subtle')
    expect(got.composerDecoration).toBe('low')
  })

  it('honours explicit choices over either default', () => {
    const got = chatLookDefaults({ userBubbleStyle: 'ornate', composerDecoration: 'off' })
    expect(got.userBubbleStyle).toBe('ornate')
    expect(got.composerDecoration).toBe('off')
  })

  it('degrades an unknown stored value to the default', () => {
    const got = chatLookDefaults({ userBubbleStyle: 'nope', composerDecoration: 'nope' })
    expect(got.userBubbleStyle).toBe('glass')
    expect(got.composerDecoration).toBe('low')
  })

  it('parses numbers with schema defaults and clamps out-of-range input', () => {
    const s = parseTaffySettings({})
    expect(s.userBubbleOpacity).toBe(72)
    expect(s.userBubbleRadius).toBe(18)
    expect(s.userBubbleMaxWidth).toBe(78)
    expect(s.composerOpacity).toBe(82)
    expect(s.composerRadius).toBe(16)
    const clamped = parseTaffySettings({ userBubbleOpacity: 5, userBubbleRadius: 99 })
    expect(clamped.userBubbleOpacity).toBeGreaterThanOrEqual(55)
    expect(clamped.userBubbleRadius).toBeLessThanOrEqual(28)
  })
})
