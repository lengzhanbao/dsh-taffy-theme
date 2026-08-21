import { describe, expect, it } from 'vitest'
import {
  ACTIVE_SELECTOR,
  BETTER_SIDEBAR_SELECTOR,
  COMPOSER_CARD_SELECTOR,
  HERO_SELECTOR,
  RIGHT_DOCK_SELECTOR,
  SIDEBAR_SELECTOR,
  WORKSPACE_SELECTOR,
} from '../src/client/chrome-selectors'

describe('chrome-selectors', () => {
  it('hero and active are distinct phase hooks', () => {
    expect(HERO_SELECTOR).toBe("[data-phase='hero']")
    expect(ACTIVE_SELECTOR).toBe("[data-phase='active']")
    expect(HERO_SELECTOR).not.toBe(ACTIVE_SELECTOR)
  })

  it('targets real DSH shell nodes', () => {
    expect(SIDEBAR_SELECTOR).toContain('sidebar')
    expect(COMPOSER_CARD_SELECTOR).toBe('[data-composer-card]')
    expect(WORKSPACE_SELECTOR).toContain("role='tablist'")
    expect(BETTER_SIDEBAR_SELECTOR).toBe('[data-dsh-better-sidebar]')
    expect(RIGHT_DOCK_SELECTOR).toContain('[data-dsh-floating-panel]')
  })
})
