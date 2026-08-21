import type { TaffyAgentState, TaffySettings } from '../state/types'
import {
  isNightScene,
  resolveAvatarUrl,
  resolveFigureUrls,
  resolvePortraitFallback,
  resolveQChromeUrls,
  resolveWallpaperUrl,
} from '../assets/resolve'
import { SKIN_OWNER } from './chrome-selectors'
import { veilBucket } from './settings-store'
import { shouldUseLowPower } from './performance'

const ROOT_ATTR = 'data-dsh-taffy-theme'

const Q_VARS = [
  '--taffy-q-face',
  '--taffy-q-send',
  '--taffy-q-stop',
  '--taffy-q-new',
  '--taffy-q-settings',
  '--taffy-q-brand',
  '--taffy-q-command',
] as const

function tagChrome(node: HTMLElement, chrome: string): HTMLElement {
  node.dataset.skinOwner = SKIN_OWNER
  node.dataset.skinChrome = chrome
  node.setAttribute('aria-hidden', 'true')
  return node
}

export function bindAssetFallback(image: HTMLImageElement, fallbackSrc?: string): void {
  image.addEventListener('error', () => {
    const current = image.getAttribute('src') ?? ''
    if (fallbackSrc && current !== fallbackSrc) {
      delete image.dataset.taffyAssetError
      image.src = fallbackSrc
      return
    }
    image.dataset.taffyAssetError = ''
  })
  image.addEventListener('load', () => {
    delete image.dataset.taffyAssetError
  })
}

export function applyImageSrc(image: HTMLImageElement, src: string): void {
  delete image.dataset.taffyAssetError
  if (image.getAttribute('src') === src) return
  image.src = src
}

function makeImage(src: string, character: 'left' | 'right'): HTMLImageElement {
  const image = document.createElement('img')
  image.dataset.skinOwner = SKIN_OWNER
  image.dataset.taffyCharacter = character
  image.alt = ''
  image.decoding = 'async'
  bindAssetFallback(image, resolvePortraitFallback())
  applyImageSrc(image, src)
  return image
}

function makeMascot(src: string): HTMLImageElement {
  const image = document.createElement('img')
  image.dataset.skinOwner = SKIN_OWNER
  image.dataset.taffyMascot = 'sidebar'
  image.alt = ''
  image.decoding = 'async'
  bindAssetFallback(image, resolvePortraitFallback())
  applyImageSrc(image, src)
  return image
}

const Q_PRELOAD_TIMEOUT_MS = 12_000

function preloadImage(url: string, timeoutMs = Q_PRELOAD_TIMEOUT_MS): Promise<boolean> {
  if (!url || url === 'none') return Promise.resolve(false)
  if (url.startsWith('data:image/')) return Promise.resolve(true)
  return new Promise((resolve) => {
    const image = new Image()
    let settled = false
    const finish = (ok: boolean): void => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      resolve(ok)
    }
    const timer = window.setTimeout(() => finish(false), timeoutMs)
    image.onload = () => finish(true)
    image.onerror = () => finish(false)
    image.src = url
  })
}

let qChromeEpoch = 0

function applyQChromeVars(body: HTMLElement, settings: TaffySettings): void {
  const epoch = ++qChromeEpoch
  const q = resolveQChromeUrls(settings)
  const entries = [
    ['--taffy-q-face', q.face],
    ['--taffy-q-send', q.send],
    ['--taffy-q-stop', q.stop],
    ['--taffy-q-new', q.newSession],
    ['--taffy-q-settings', q.settings],
    ['--taffy-q-brand', q.brand],
    ['--taffy-q-command', q.command],
  ] as const

  body.removeAttribute('data-taffy-q-ready')
  for (const [key] of entries) body.style.setProperty(key, 'none')

  void Promise.all(entries.map(async ([key, url]) => {
    const ok = await preloadImage(url)
    if (epoch !== qChromeEpoch) return false
    body.style.setProperty(key, ok ? `url("${url}")` : 'none')
    return ok
  })).then((loaded) => {
    if (epoch !== qChromeEpoch) return
    if (loaded.every(Boolean)) body.setAttribute('data-taffy-q-ready', '')
  })
}

export function applyRootAttributes(body: HTMLElement, settings: TaffySettings, state: TaffyAgentState): void {
  if (!settings.enabled) {
    body.removeAttribute(ROOT_ATTR)
    body.removeAttribute('data-taffy-state')
    body.removeAttribute('data-taffy-preset')
    body.removeAttribute('data-dsh-taffy-intensity')
    body.removeAttribute('data-dsh-taffy-motion')
    body.removeAttribute('data-dsh-taffy-reduced-motion')
    body.removeAttribute('data-taffy-veil')
    body.removeAttribute('data-taffy-acrylic-percent')
    body.removeAttribute('data-taffy-frame-opacity')
    body.removeAttribute('data-taffy-panel-opacity')
    body.removeAttribute('data-taffy-character-opacity')
    body.removeAttribute('data-taffy-hide-left')
    body.removeAttribute('data-taffy-hide-right')
    body.removeAttribute('data-taffy-hide-mascot')
    body.removeAttribute('data-taffy-q-ready')
    body.removeAttribute('data-taffy-low-power')
    clearOpacityVars(body)
    return
  }

  body.setAttribute(ROOT_ATTR, '')
  body.setAttribute('data-taffy-state', state)
  body.setAttribute('data-taffy-preset', settings.colors.preset)
  body.setAttribute('data-dsh-taffy-intensity', settings.colors.dynamicIntensity)
  body.setAttribute('data-dsh-taffy-motion', settings.motion === 'off' ? 'off' : 'standard')
  body.setAttribute(
    'data-dsh-taffy-reduced-motion',
    settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'true' : 'false',
  )
  body.setAttribute('data-taffy-veil', veilBucket(settings))
  body.setAttribute('data-taffy-acrylic-percent', String(settings.acrylicPercent))
  body.setAttribute('data-taffy-frame-opacity', String(settings.frameOpacity))
  body.setAttribute('data-taffy-panel-opacity', String(settings.panelOpacity))
  body.setAttribute('data-taffy-character-opacity', String(settings.characterOpacity))
  applyOpacityVars(body, settings)
  body.toggleAttribute('data-taffy-hide-left', !settings.showLeftCharacter)
  body.toggleAttribute('data-taffy-hide-right', !settings.showRightCharacter)
  body.toggleAttribute('data-taffy-hide-mascot', !settings.showMascot)
  body.toggleAttribute('data-taffy-low-power', shouldUseLowPower(settings))
  applyQChromeVars(body, settings)
}

export function syncStageArt(root: HTMLElement = document.body, settings?: TaffySettings): void {
  const night = isNightScene(root)
  const wallpaper = root.querySelector('[data-taffy-wallpaper]')
  const wallpaperUrl = resolveWallpaperUrl(night)
  if (wallpaper instanceof HTMLImageElement && wallpaperUrl) applyImageSrc(wallpaper, wallpaperUrl)

  const figures = resolveFigureUrls(night)
  const left = root.querySelector("[data-taffy-character='left']")
  const right = root.querySelector("[data-taffy-character='right']")
  const mascot = root.querySelector("[data-taffy-mascot='sidebar']")
  if (left instanceof HTMLImageElement) applyImageSrc(left, figures.left)
  if (right instanceof HTMLImageElement) applyImageSrc(right, figures.right)
  if (settings && mascot instanceof HTMLImageElement) applyImageSrc(mascot, resolveAvatarUrl(settings, undefined, night))
}

export function createCharacterStage(settings: TaffySettings): HTMLElement | null {
  if (!settings.enabled) return null

  const night = isNightScene()
  const stage = tagChrome(document.createElement('div'), 'character-stage')
  const wallpaperUrl = resolveWallpaperUrl(night)
  if (wallpaperUrl) {
    const wallpaper = document.createElement('img')
    wallpaper.dataset.skinOwner = SKIN_OWNER
    wallpaper.dataset.taffyWallpaper = 'paper'
    wallpaper.alt = ''
    wallpaper.decoding = 'async'
    bindAssetFallback(wallpaper)
    applyImageSrc(wallpaper, wallpaperUrl)
    stage.append(wallpaper)
  }

  const veil = document.createElement('div')
  veil.dataset.skinOwner = SKIN_OWNER
  veil.dataset.taffyVeil = 'curtain'
  stage.append(veil)

  if (settings.portrait !== 'off') {
    const figures = resolveFigureUrls(night)
    stage.append(
      makeImage(figures.left, 'left'),
      makeImage(figures.right, 'right'),
    )
  }
  return stage
}

export function createAtelierFrame(): HTMLElement {
  const frame = tagChrome(document.createElement('div'), 'atelier-frame')
  const corners = document.createElement('span')
  corners.dataset.taffyFrameCorners = ''
  corners.setAttribute('aria-hidden', 'true')
  for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const) {
    const node = document.createElement('span')
    node.dataset.taffyFrameCorner = corner
    node.setAttribute('aria-hidden', 'true')
    corners.append(node)
  }
  const badge = document.createElement('span')
  badge.dataset.taffyFrameBadge = ''
  badge.setAttribute('aria-hidden', 'true')
  frame.append(corners, badge)
  return frame
}

export function createStageCurtains(): HTMLElement[] {
  const top = tagChrome(document.createElement('div'), 'taffy-top-curtain')
  const bottom = tagChrome(document.createElement('div'), 'taffy-bottom-curtain')
  return [top, bottom]
}

export function createSidebarTrim(): HTMLElement {
  const trim = tagChrome(document.createElement('div'), 'sidebar-trim')
  for (const corner of ['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const) {
    const node = document.createElement('span')
    node.dataset.taffySidebarCorner = corner
    node.setAttribute('aria-hidden', 'true')
    trim.append(node)
  }
  for (const part of ['ribbon', 'swag'] as const) {
    const node = document.createElement('span')
    node.dataset.taffySidebarOrnament = part
    node.setAttribute('aria-hidden', 'true')
    trim.append(node)
  }
  return trim
}

export function createTrims(): HTMLElement[] {
  return [...createStageCurtains(), createAtelierFrame(), createSidebarTrim()]
}

export function decorateSidebar(settings: TaffySettings, sidebar: HTMLElement): HTMLElement[] {
  if (sidebar.querySelector("[data-taffy-mascot='sidebar']")) return []
  const inner = sidebar.querySelector(':scope > div')
  const host = inner instanceof HTMLElement ? inner : sidebar
  const mascot = makeMascot(resolveAvatarUrl(settings, undefined, isNightScene()))
  host.prepend(mascot)
  return [mascot]
}

export function removeOwnedChrome(root: ParentNode = document): void {
  root.querySelectorAll(`[data-skin-owner="${SKIN_OWNER}"]`).forEach((node) => node.remove())
}

const OPACITY_VARS = [
  '--taffy-frame-opacity',
  '--taffy-panel-opacity',
  '--taffy-veil-opacity',
  '--taffy-character-opacity',
  '--taffy-acrylic-percent',
] as const

function clearOpacityVars(body: HTMLElement): void {
  for (const key of OPACITY_VARS) body.style.removeProperty(key)
}

function applyOpacityVars(body: HTMLElement, settings: TaffySettings): void {
  body.style.setProperty('--taffy-frame-opacity', String(settings.frameOpacity / 100))
  body.style.setProperty('--taffy-panel-opacity', String(settings.panelOpacity))
  body.style.setProperty('--taffy-veil-opacity', String(settings.veilOpacity / 100))
  body.style.setProperty('--taffy-character-opacity', String(settings.characterOpacity / 100))
  body.style.setProperty('--taffy-acrylic-percent', String(settings.acrylicPercent))
}

export const TAFFY_INLINE_STYLE_KEYS = [
  ...Q_VARS,
  ...OPACITY_VARS,
  '--taffy-conversation-left',
  '--taffy-conversation-top',
  '--taffy-conversation-width',
  '--taffy-conversation-height',
  '--taffy-conversation-content-left',
  '--taffy-conversation-content-width',
  '--taffy-conversation-viewport-top',
  '--taffy-conversation-viewport-height',
  '--taffy-content-left',
  '--taffy-content-width',
  '--taffy-viewport-top',
  '--taffy-viewport-height',
  '--taffy-frame-left',
  '--taffy-frame-top',
  '--taffy-frame-width',
  '--taffy-frame-height',
  '--taffy-right-panel-width',
  '--taffy-frame-right-inset',
] as const
