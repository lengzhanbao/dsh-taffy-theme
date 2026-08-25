import type { TaffySettings } from '../state/types'
import { decorateSidebar } from './mount'
import { SIDEBAR_SELECTOR, SKIN_OWNER } from './chrome-selectors'
import { createRafScheduler } from './schedule'
import { createHeroCopySync, touchesHeroCopy } from './hero-copy'

export interface ChromeObserverOptions {
  getSettings: () => TaffySettings
  onNodes?: (nodes: HTMLElement[]) => void
  onSidebarChange?: () => void
}

function isSkinOwned(node: Node): boolean {
  return node instanceof Element
    && (node.getAttribute('data-skin-owner') === SKIN_OWNER
      || node.closest(`[data-skin-owner="${SKIN_OWNER}"]`) !== null)
}

function touchesSelector(node: Node, selector: string): boolean {
  return node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null)
}

export function createChromeObserver(options: ChromeObserverOptions): { disconnect: () => void } {
  const sidebarNodes = new Map<HTMLElement, HTMLElement[]>()
  const heroCopy = createHeroCopySync()

  const clearSidebar = (sidebar: HTMLElement): void => {
    for (const node of sidebarNodes.get(sidebar) ?? []) node.remove()
    sidebarNodes.delete(sidebar)
  }

  const maybeDecorateSidebar = (): void => {
    const settings = options.getSettings()
    if (!settings.enabled) return
    const sidebar = document.querySelector(SIDEBAR_SELECTOR)
    if (!(sidebar instanceof HTMLElement)) return
    if (sidebar.querySelector(`[data-skin-owner="${SKIN_OWNER}"][data-taffy-mascot='sidebar']`)) return
    clearSidebar(sidebar)
    const nodes = decorateSidebar(settings, sidebar)
    sidebarNodes.set(sidebar, nodes)
    options.onNodes?.(nodes)
    options.onSidebarChange?.()
  }

  const scheduler = createRafScheduler(maybeDecorateSidebar)

  const observer = new MutationObserver((mutations) => {
    let sidebarChanged = false
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const parent = mutation.target.parentElement
        if (parent instanceof Element && parent.matches("[class*='headlineText']")) heroCopy.apply(parent)
        continue
      }
      if (mutation.type === 'childList') {
        if (mutation.target instanceof Element && mutation.target.matches("[class*='headlineText']")) heroCopy.apply(mutation.target)
        for (const node of mutation.addedNodes) {
          if (isSkinOwned(node)) continue
          if (touchesHeroCopy(node)) heroCopy.apply(node instanceof Element ? node : document)
          if (touchesSelector(node, SIDEBAR_SELECTOR)) sidebarChanged = true
        }
      }
    }
    if (sidebarChanged) scheduler.schedule()
  })

  observer.observe(document.body, { childList: true, characterData: true, subtree: true })
  heroCopy.apply(document)
  maybeDecorateSidebar()

  return {
    disconnect: () => {
      scheduler.cancel()
      observer.disconnect()
      heroCopy.restore()
      for (const sidebar of sidebarNodes.keys()) clearSidebar(sidebar)
      sidebarNodes.clear()
    },
  }
}
