import { describe, expect, it } from 'vitest'
import { parseTaffySettings } from '../src/config.ts'
import {
  DEFAULT_CHIBI,
  DEFAULT_FUNCTIONAL_BACKGROUND,
  DEFAULT_HERO_BACKGROUND,
  DEFAULT_SIDEBAR_WATERMARK,
  resolveChibiUrl,
  resolveSceneBackground,
  resolveSidebarWatermarkUrl,
} from '../src/assets/resolve.ts'

/**
 * The art resolvers decide which picture a surface gets. They are pure, so the
 * rules the redesign bundle asked for can be pinned here rather than inferred
 * from a screenshot.
 *
 * Key rule: `default` follows the mode. The supplied art is Astral Night
 * material (five night interiors), so it is the dark-mode backdrop and Pearl
 * Bloom keeps the wallpaper drawn for it. An explicit id is an instruction and
 * therefore applies in either mode.
 */

const settings = (patch: Record<string, string> = {}) => parseTaffySettings(patch)

describe('scene background', () => {
  it('uses the hero and functional defaults in dark mode', () => {
    const hero = resolveSceneBackground(settings(), { night: true, functional: false })
    const functional = resolveSceneBackground(settings(), { night: true, functional: true })
    expect(hero).toContain(`backgrounds/${DEFAULT_HERO_BACKGROUND}.webp`)
    expect(functional).toContain(`backgrounds/${DEFAULT_FUNCTIONAL_BACKGROUND}.webp`)
    expect(hero).not.toBe(functional)
  })

  it('keeps the Pearl Bloom wallpaper in light mode when nothing is chosen', () => {
    expect(resolveSceneBackground(settings(), { night: false, functional: false }))
      .toContain('wallpaper-light.webp')
    expect(resolveSceneBackground(settings(), { night: false, functional: true }))
      .toContain('wallpaper-light.webp')
  })

  it('honours an explicit choice in either mode', () => {
    const chosen = settings({ backgroundHero: 'piano', backgroundFunctional: 'observatory' })
    expect(resolveSceneBackground(chosen, { night: false, functional: false }))
      .toContain('backgrounds/piano.webp')
    expect(resolveSceneBackground(chosen, { night: true, functional: true }))
      .toContain('backgrounds/observatory.webp')
  })

  it('falls back to the mode default for an id that no longer ships', () => {
    const stale = settings({ backgroundHero: 'deleted-in-some-future-release' })
    expect(resolveSceneBackground(stale, { night: true, functional: false }))
      .toContain(`backgrounds/${DEFAULT_HERO_BACKGROUND}.webp`)
    expect(resolveSceneBackground(stale, { night: false, functional: false }))
      .toContain('wallpaper-light.webp')
  })

  it('always returns a url the asset route can serve', () => {
    for (const night of [true, false]) {
      for (const functional of [true, false]) {
        const url = resolveSceneBackground(settings(), { night, functional })
        expect(url.startsWith('/plugins/')).toBe(true)
        expect(url).toContain('/assets/taffy/')
      }
    }
  })
})

describe('sidebar watermark', () => {
  it('defaults to the quieter celestial portrait', () => {
    expect(resolveSidebarWatermarkUrl(settings())).toContain(`sidebar/${DEFAULT_SIDEBAR_WATERMARK}.webp`)
  })

  it('can be switched off entirely', () => {
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'none' }))).toBe('')
  })

  it('honours the other supplied portrait', () => {
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'celestial-plum' }))).toContain('sidebar/celestial-plum.webp')
  })

  it('degrades to the default for an unknown id', () => {
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'nope' })))
      .toContain(`sidebar/${DEFAULT_SIDEBAR_WATERMARK}.webp`)
  })
})

describe('chibi mascot', () => {
  it('defaults to the supplied sticker', () => {
    expect(resolveChibiUrl(settings())).toContain(`chibi/${DEFAULT_CHIBI}.webp`)
  })

  it('can be reverted to the round avatar', () => {
    expect(resolveChibiUrl(settings({ chibiMascot: 'classic' }))).toContain('avatar.webp')
  })

  it('honours the other supplied sticker', () => {
    expect(resolveChibiUrl(settings({ chibiMascot: 'open-arms' }))).toContain('chibi/open-arms.webp')
  })
})

