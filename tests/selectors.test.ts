import { describe, expect, it } from 'vitest'
import {
  ACTIVE_SELECTOR,
  HERO_SELECTOR,
  COMPOSER_CARD_SELECTOR,
  SIDEBAR_SELECTOR,
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
  })
})
