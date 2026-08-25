import {
  ACTIVE_SELECTOR,
  BETTER_SIDEBAR_SELECTOR,
  CHAT_FLOW_SELECTOR,
  SETTINGS_DIALOG_SELECTOR,
  WORKSPACE_SELECTOR,
} from './chrome-selectors'
import { createRafScheduler } from './schedule'


const STATE_TRACKED_SELECTOR = [
  ACTIVE_SELECTOR,
  CHAT_FLOW_SELECTOR,
  WORKSPACE_SELECTOR,
  BETTER_SIDEBAR_SELECTOR,
  SETTINGS_DIALOG_SELECTOR,
  '[data-dsh-floating-panel]',
].join(', ')

function touchesTrackedState(node: Node): boolean {
  if (!(node instanceof Element)) return false
  return node.matches(STATE_TRACKED_SELECTOR)
    || node.closest(STATE_TRACKED_SELECTOR) !== null
    || node.querySelector(STATE_TRACKED_SELECTOR) !== null
}


export function startProjectedState(body: HTMLElement): () => void {
  const sync = (): void => {
    const conversationFlow = body.querySelector(`${ACTIVE_SELECTOR} ${CHAT_FLOW_SELECTOR}`) !== null
    body.toggleAttribute('data-taffy-chat-active', conversationFlow)
    body.toggleAttribute('data-taffy-conversation-active', body.querySelector(ACTIVE_SELECTOR) !== null)
    body.toggleAttribute('data-taffy-workspace', body.querySelector(WORKSPACE_SELECTOR) !== null)
    body.toggleAttribute(
      'data-taffy-better-sidebar-open',
      (() => {
        const panel = body.querySelector(BETTER_SIDEBAR_SELECTOR)
        if (!(panel instanceof HTMLElement)) return false
        if (body.hasAttribute('data-dsh-sidebar-collapsed')) return false
        const box = panel.getBoundingClientRect()
        return box.height > 80 && box.width > 160 && box.width < window.innerWidth * 0.72
      })(),
    )
    body.toggleAttribute('data-taffy-settings-open', body.querySelector(SETTINGS_DIALOG_SELECTOR) !== null)
    body.toggleAttribute(
      'data-dsh-floating-panel-open',
      body.querySelector('[data-dsh-floating-panel]') !== null,
    )
  }

  sync()
  const scheduler = createRafScheduler(sync)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        scheduler.schedule()
        return
      }
      if (mutation.type !== 'childList') continue
      if ([...mutation.addedNodes, ...mutation.removedNodes].some(touchesTrackedState)) {
        scheduler.schedule()
        return
      }
    }
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-phase', 'data-chat-flow', 'data-dsh-better-sidebar', 'data-dsh-sidebar-collapsed'],
    childList: true,
    subtree: true,
  })

  return () => {
    scheduler.cancel()
    observer.disconnect()
    body.removeAttribute('data-taffy-chat-active')
    body.removeAttribute('data-taffy-conversation-active')
    body.removeAttribute('data-taffy-workspace')
    body.removeAttribute('data-taffy-better-sidebar-open')
    body.removeAttribute('data-taffy-settings-open')
    body.removeAttribute('data-dsh-floating-panel-open')
  }
}
