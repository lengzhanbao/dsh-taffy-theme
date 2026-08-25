import {
  CHAT_FLOW_SELECTOR,
  COMPOSER_CARD_SELECTOR,
  COMPOSER_OVERLAY_SELECTOR,
  CONVERSATION_SCROLL_SELECTOR,
  CONVERSATION_SELECTOR,
  DETAILS_SELECTOR,
  HERO_SELECTOR,
  SIDEBAR_SELECTOR,
  STREAMING_SELECTOR,
} from './chrome-selectors'
import { restoreInlineStyles, snapshotInlineStyles } from './inline-restore'
import { stampMetrics } from './metrics-stamp'
import { createRafScheduler } from './schedule'

const MEASURE_INTERVAL_MS = 16
const STREAMING_MEASURE_INTERVAL_MS = 120
const STREAMING_STAMP_INTERVAL_MS = 500

export const CONVERSATION_METRIC_KEYS = [
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
  '--taffy-frame-right-inset',
  '--taffy-composer-top',
  '--taffy-composer-height',
] as const

export const FRAME_COMPACT_WIDTH = 420
export const FRAME_HIDDEN_MIN = 48
export const FRAME_PAD_X = 4
export const FRAME_PAD_Y = 4
export const FRAME_SHELL_INSET = 0

export function computeFrameBox(rects: {
  shell: { left: number; top: number; width: number; height: number }
  content: { left: number; width: number }
  viewport: { left?: number; top: number; width?: number; height: number }
  composer?: { left: number; top: number; width: number; height: number } | null
}): { left: number; top: number; width: number; height: number } {
  const { shell, content, viewport, composer } = rects
  const viewportLeft = typeof viewport.left === 'number' ? viewport.left : content.left
  const viewportWidth = typeof viewport.width === 'number' && viewport.width > 40 ? viewport.width : content.width
  let left = viewportLeft - FRAME_PAD_X
  let right = viewportLeft + viewportWidth + FRAME_PAD_X
  let top = viewport.top - FRAME_PAD_Y
  let bottom = viewport.top + viewport.height + FRAME_PAD_Y

  if (content.width > 40) {
    left = Math.min(left, content.left - FRAME_PAD_X)
    right = Math.max(right, content.left + content.width + FRAME_PAD_X)
  }

  if (composer && composer.width > 40 && composer.height > 24) {
    left = Math.min(left, composer.left - FRAME_PAD_X)
    right = Math.max(right, composer.left + composer.width + FRAME_PAD_X)
    top = Math.min(top, composer.top - FRAME_PAD_Y)
    bottom = Math.max(bottom, composer.top + composer.height + FRAME_PAD_Y)
  }

  const shellLeft = shell.left + FRAME_SHELL_INSET
  const shellTop = shell.top + FRAME_SHELL_INSET
  const shellRight = shell.left + shell.width - FRAME_SHELL_INSET
  const shellBottom = shell.top + shell.height - FRAME_SHELL_INSET

  left = Math.max(left, shellLeft)
  top = Math.max(top, shellTop)
  right = Math.min(right, shellRight)
  bottom = Math.min(bottom, shellBottom)

  if (right - left < FRAME_HIDDEN_MIN || bottom - top < FRAME_HIDDEN_MIN) {
    return {
      left: Math.round(shellLeft),
      top: Math.round(shellTop),
      width: Math.max(0, Math.round(shellRight - shellLeft)),
      height: Math.max(0, Math.round(shellBottom - shellTop)),
    }
  }

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(right - left),
    height: Math.round(bottom - top),
  }
}

const TRACKED_SELECTOR = [
  CONVERSATION_SELECTOR,
  CHAT_FLOW_SELECTOR,
  CONVERSATION_SCROLL_SELECTOR,
  COMPOSER_CARD_SELECTOR,
  COMPOSER_OVERLAY_SELECTOR,
  HERO_SELECTOR,
  SIDEBAR_SELECTOR,
  DETAILS_SELECTOR,
  "[data-phase='active']",
].join(', ')

function asElement(node: Node | null | undefined): HTMLElement | null {
  return node instanceof HTMLElement ? node : null
}

function visibleWidth(node: HTMLElement | null): number {
  return node ? node.getBoundingClientRect().width : 0
}

export function findConversationPane(doc: Document): HTMLElement | null {
  const preferred = asElement(doc.querySelector("[data-pane='conversation']"))
  if (preferred && visibleWidth(preferred) > 0) return preferred

  const candidates = [...doc.querySelectorAll(CONVERSATION_SELECTOR)].filter((node): node is HTMLElement => {
    return node instanceof HTMLElement
  })
  let best: HTMLElement | null = null
  let bestWidth = 0
  for (const node of candidates) {
    const width = node.getBoundingClientRect().width
    if (width > bestWidth) {
      best = node
      bestWidth = width
    }
  }
  return best
}

export function findChatFlow(shell: HTMLElement): HTMLElement | null {
  const scoped = asElement(shell.querySelector(CHAT_FLOW_SELECTOR))
  if (scoped && visibleWidth(scoped) > 0) return scoped
  const global = asElement(shell.ownerDocument.querySelector(CHAT_FLOW_SELECTOR))
  return global && visibleWidth(global) > 0 ? global : null
}

export function findConversationScroll(shell: HTMLElement): HTMLElement | null {
  const scoped = asElement(shell.querySelector(CONVERSATION_SCROLL_SELECTOR))
  if (scoped && scoped.getBoundingClientRect().height > 0) return scoped
  return asElement(shell.ownerDocument.querySelector(CONVERSATION_SCROLL_SELECTOR))
}

export function findContentColumn(shell: HTMLElement): HTMLElement {
  const phaseRoot = asElement(shell.querySelector('[data-phase]'))
  const hero = shell.matches(HERO_SELECTOR) || phaseRoot?.getAttribute('data-phase') === 'hero'
  if (hero) {
    const composer = asElement(shell.querySelector(COMPOSER_CARD_SELECTOR))
    if (composer && visibleWidth(composer) > 0) return composer
  }
  return findChatFlow(shell) ?? findConversationScroll(shell) ?? shell
}

export function findViewportColumn(shell: HTMLElement, content: HTMLElement): HTMLElement {
  const phaseRoot = asElement(shell.querySelector('[data-phase]'))
  const hero = shell.matches(HERO_SELECTOR) || phaseRoot?.getAttribute('data-phase') === 'hero'
  if (hero) return content
  return findConversationScroll(shell) ?? shell
}

export function findComposerCard(shell: HTMLElement): HTMLElement | null {
  const scoped = asElement(shell.querySelector(COMPOSER_CARD_SELECTOR))
  if (scoped && visibleWidth(scoped) > 0) return scoped
  const global = asElement(shell.ownerDocument.querySelector(COMPOSER_CARD_SELECTOR))
  return global && visibleWidth(global) > 0 ? global : null
}

export function writeConversationRect(body: HTMLElement, rect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>): void {
  writeConversationMetrics(body, { shell: rect, content: rect, viewport: rect })
}

export function writeConversationMetrics(
  body: HTMLElement,
  rects: {
    shell: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>
    content: Pick<DOMRectReadOnly, 'left' | 'width'>
    viewport: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>
    composer?: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'> | null
  },
): void {
  const hidden = rects.content.width < FRAME_HIDDEN_MIN || rects.viewport.height < FRAME_HIDDEN_MIN
  const frame = computeFrameBox(rects)
  const hasComposer = Boolean(rects.composer && rects.composer.width > 40 && rects.composer.height > 24)
  const composerTop = hasComposer && rects.composer ? Math.round(rects.composer.top) : frame.top + frame.height
  const composerHeight = hasComposer && rects.composer ? Math.round(rects.composer.height) : 0
  const vw = body.ownerDocument.defaultView?.innerWidth ?? 0
  const fromContent = rects.content.width > 40
    ? Math.max(0, Math.round(vw - (rects.content.left + rects.content.width)))
    : 0

  // Avoid redundant custom-property writes; each one can invalidate style/layout.
  const metrics: Array<[string, string]> = [
    ['--taffy-conversation-left', `${Math.round(rects.shell.left)}px`],
    ['--taffy-conversation-top', `${Math.round(rects.shell.top)}px`],
    ['--taffy-conversation-width', `${Math.round(rects.shell.width)}px`],
    ['--taffy-conversation-height', `${Math.round(rects.shell.height)}px`],
    ['--taffy-conversation-content-left', `${Math.round(rects.content.left)}px`],
    ['--taffy-conversation-content-width', `${Math.round(rects.content.width)}px`],
    ['--taffy-conversation-viewport-top', `${Math.round(rects.viewport.top)}px`],
    ['--taffy-conversation-viewport-height', `${Math.round(rects.viewport.height)}px`],
    ['--taffy-content-left', `${Math.round(rects.content.left)}px`],
    ['--taffy-content-width', `${Math.round(rects.content.width)}px`],
    ['--taffy-viewport-top', `${Math.round(rects.viewport.top)}px`],
    ['--taffy-viewport-height', `${Math.round(rects.viewport.height)}px`],
    ['--taffy-frame-left', `${frame.left}px`],
    ['--taffy-frame-top', `${frame.top}px`],
    ['--taffy-frame-width', `${frame.width}px`],
    ['--taffy-frame-height', `${frame.height}px`],
    ['--taffy-composer-top', `${composerTop}px`],
    ['--taffy-composer-height', `${composerHeight}px`],
    ['--taffy-frame-right-inset', `${fromContent}px`],
  ]
  for (const [key, value] of metrics) {
    if (body.style.getPropertyValue(key) !== value) body.style.setProperty(key, value)
  }
  body.toggleAttribute('data-taffy-frame-hidden', hidden)
  body.toggleAttribute('data-taffy-frame-compact', !hidden && rects.content.width < FRAME_COMPACT_WIDTH)
}

export function clearConversationRect(body: HTMLElement): void {
  for (const key of CONVERSATION_METRIC_KEYS) body.style.removeProperty(key)
  body.removeAttribute('data-taffy-frame-hidden')
  body.removeAttribute('data-taffy-frame-compact')
}

function touchesTracked(node: Node): boolean {
  if (!(node instanceof Element)) return false
  return Element.prototype.matches.call(node, TRACKED_SELECTOR)
    || Element.prototype.querySelector.call(node, TRACKED_SELECTOR) !== null
}

export function startConversationMetrics(doc: Document, body: HTMLElement): () => void {
  const original = snapshotInlineStyles(body, CONVERSATION_METRIC_KEYS)
  let shell: HTMLElement | null = null
  let content: HTMLElement | null = null
  let viewport: HTMLElement | null = null
  let composer: HTMLElement | null = null
  let sidebar: HTMLElement | null = null
  let details: HTMLElement | null = null
  let lastStampAt = 0
  let resizeObserver: ResizeObserver | undefined
  let mutationObserver: MutationObserver | undefined
  let disposed = false

  const syncObserved = (next: HTMLElement | null, current: HTMLElement | null): HTMLElement | null => {
    if (next === current) return current
    if (current) resizeObserver?.unobserve(current)
    if (next) resizeObserver?.observe(next)
    return next
  }

  const measure = (): void => {
    if (disposed) return
    const nextShell = findConversationPane(doc)
    shell = syncObserved(nextShell, shell)
    if (!shell) {
      content = syncObserved(null, content)
      viewport = syncObserved(null, viewport)
      composer = syncObserved(null, composer)
      sidebar = syncObserved(null, sidebar)
      details = syncObserved(null, details)
      body.setAttribute('data-taffy-frame-hidden', '')
      body.removeAttribute('data-taffy-frame-compact')
      for (const key of CONVERSATION_METRIC_KEYS) body.style.removeProperty(key)
      return
    }

    const nextContent = findContentColumn(shell)
    const nextViewport = findViewportColumn(shell, nextContent)
    const nextComposer = findComposerCard(shell)
    content = syncObserved(nextContent, content)
    viewport = syncObserved(nextViewport, viewport)
    composer = syncObserved(nextComposer, composer)
    sidebar = syncObserved(asElement(doc.querySelector(SIDEBAR_SELECTOR)), sidebar)
    details = syncObserved(asElement(doc.querySelector(DETAILS_SELECTOR)), details)
    writeConversationMetrics(body, {
      shell: shell.getBoundingClientRect(),
      content: nextContent.getBoundingClientRect(),
      viewport: nextViewport.getBoundingClientRect(),
      composer: nextComposer?.getBoundingClientRect() ?? null,
    })

    const streaming = doc.querySelector(STREAMING_SELECTOR) !== null
    scheduler.setMinInterval(streaming ? STREAMING_MEASURE_INTERVAL_MS : MEASURE_INTERVAL_MS)
    const now = Date.now()
    if (!streaming || now - lastStampAt >= STREAMING_STAMP_INTERVAL_MS) {
      stampMetrics(doc, body)
      lastStampAt = now
    }
  }

  const scheduler = createRafScheduler(measure, MEASURE_INTERVAL_MS)

  const onWindowResize = (): void => scheduler.schedule()

  const dispose = (): void => {
    if (disposed) return
    disposed = true
    scheduler.cancel()
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    window.removeEventListener('resize', onWindowResize)
    window.visualViewport?.removeEventListener('resize', onWindowResize)
    restoreInlineStyles(body, original)
    body.removeAttribute('data-taffy-frame-hidden')
    body.removeAttribute('data-taffy-frame-compact')
  }

  try {
    resizeObserver = new ResizeObserver(() => scheduler.schedule())
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          scheduler.schedule()
          return
        }
        if (mutation.type !== 'childList') continue
        for (const node of mutation.addedNodes) {
          if (touchesTracked(node)) {
            scheduler.schedule()
            return
          }
        }
        for (const node of mutation.removedNodes) {
          if (touchesTracked(node) || node === shell || node === content || node === viewport || node === composer) {
            scheduler.schedule()
            return
          }
        }
      }
    })
    mutationObserver.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-phase', 'data-chat-flow', 'data-conversation-composer-overlay'],
    })
    window.addEventListener('resize', onWindowResize)
    window.visualViewport?.addEventListener('resize', onWindowResize)
    measure()
  } catch (error) {
    dispose()
    throw error
  }

  return dispose
}
