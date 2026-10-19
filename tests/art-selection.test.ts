import { describe, expect, it } from 'vitest'
import { parseTaffySettings } from '../src/config.ts'
import {
  resolveChibiUrl,
  resolveSceneBackground,
  resolveSidebarWatermarkUrl,
} from '../src/assets/resolve.ts'

/**
 * The art resolvers decide which picture a surface gets.
 *
 * The governing rule is that upgrading must not change what the user sees.
 * `default` therefore means the classic wallpaper for the active mode, no
 * watermark layer at all, and the round avatar that predates the art pack.
 * Every supplied asset is an explicit choice. The classic pair also stays
 * selectable on its own, so a light theme can deliberately use the dark stage
 * and vice versa.
 */

const settings = (patch: Record<string, string> = {}) => parseTaffySettings(patch)

describe('scene background', () => {
  it('leaves an untouched install on the classic wallpaper', () => {
    expect(resolveSceneBackground(settings(), { night: true, functional: false })).toContain('wallpaper-dark.webp')
    expect(resolveSceneBackground(settings(), { night: false, functional: false })).toContain('wallpaper-light.webp')
    expect(resolveSceneBackground(settings(), { night: true, functional: true })).toContain('wallpaper-dark.webp')
    expect(resolveSceneBackground(settings(), { night: false, functional: true })).toContain('wallpaper-light.webp')
  })

  it('offers both classic wallpapers as explicit choices', () => {
    const picked = settings({ backgroundHero: 'classic-dark' })
    expect(resolveSceneBackground(picked, { night: false, functional: false })).toContain('wallpaper-dark.webp')
    const other = settings({ backgroundHero: 'classic-light' })
    expect(resolveSceneBackground(other, { night: true, functional: false })).toContain('wallpaper-light.webp')
  })

  it('honours a supplied asset in either mode', () => {
    const chosen = settings({ backgroundHero: 'piano', backgroundFunctional: 'observatory' })
    expect(resolveSceneBackground(chosen, { night: false, functional: false })).toContain('backgrounds/piano.webp')
    expect(resolveSceneBackground(chosen, { night: true, functional: true })).toContain('backgrounds/observatory.webp')
  })

  it('keeps hero and functional independent', () => {
    const mixed = settings({ backgroundHero: 'atelier', backgroundFunctional: 'studio' })
    expect(resolveSceneBackground(mixed, { night: true, functional: false })).toContain('backgrounds/atelier.webp')
    expect(resolveSceneBackground(mixed, { night: true, functional: true })).toContain('backgrounds/studio.webp')
  })

  it('falls back to the classic wallpaper for an unknown id', () => {
    const stale = settings({ backgroundHero: 'deleted-in-some-future-release' })
    expect(resolveSceneBackground(stale, { night: true, functional: false })).toContain('wallpaper-dark.webp')
    expect(resolveSceneBackground(stale, { night: false, functional: false })).toContain('wallpaper-light.webp')
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
  it('ships no layer until one is chosen', () => {
    expect(resolveSidebarWatermarkUrl(settings())).toBe('')
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'none' }))).toBe('')
  })

  it('accepts either supplied portrait', () => {
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'celestial-sidebar' }))).toContain('sidebar/celestial-sidebar.webp')
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'celestial-plum' }))).toContain('sidebar/celestial-plum.webp')
  })

  it('degrades to no layer for an unknown id', () => {
    expect(resolveSidebarWatermarkUrl(settings({ sidebarWatermark: 'nope' }))).toBe('')
  })
})

describe('chibi mascot', () => {
  it('keeps the pre-existing avatar by default', () => {
    expect(resolveChibiUrl(settings())).toContain('avatar.webp')
    expect(resolveChibiUrl(settings({ chibiMascot: 'classic' }))).toContain('avatar.webp')
  })

  it('accepts either supplied sticker', () => {
    expect(resolveChibiUrl(settings({ chibiMascot: 'cat-hug' }))).toContain('chibi/cat-hug.webp')
    expect(resolveChibiUrl(settings({ chibiMascot: 'open-arms' }))).toContain('chibi/open-arms.webp')
  })

  it('degrades to the avatar for an unknown id', () => {
    expect(resolveChibiUrl(settings({ chibiMascot: 'nope' }))).toContain('avatar.webp')
  })
})
