import type { TaffyAgentState } from '../state/types'
import { mapDomSignals } from '../state/adapter'
import {
  ACTIVE_SELECTOR,
  STREAMING_SELECTOR,
  TOOL_RUNNING_SELECTOR,
} from './chrome-selectors'
import { createRafScheduler } from './schedule'

export interface StateViewOptions {
  onState: (state: TaffyAgentState) => void
}

const AGENT_THROTTLE_MS = 120

export function createStateObserver(options: StateViewOptions): () => void {
  const body = document.body
  let lastEmitAt = 0
  let trailing: ReturnType<typeof setTimeout> | undefined

  const readSignals = (): void => {
    const now = Date.now()
    const elapsed = now - lastEmitAt
    if (elapsed < AGENT_THROTTLE_MS) {
      // Trailing edge. Returning outright (the old behaviour) dropped the last
      // mutation of a burst, so `data-taffy-state` could latch on a stale value
      // until some later DOM change happened to arrive.
      if (trailing === undefined) {
        trailing = setTimeout(() => {
          trailing = undefined
          readSignals()
        }, AGENT_THROTTLE_MS - elapsed)
      }
      return
    }

    const activeConversation = body.querySelector(ACTIVE_SELECTOR) !== null
    const streaming = body.querySelector(STREAMING_SELECTOR) !== null
    // Only live tool execution counts; a transcript full of finished tool cards
    // must not report `tool-calling`.
    const toolRunning = body.querySelector(TOOL_RUNNING_SELECTOR) !== null
    lastEmitAt = now

    mapDomSignals({ activeConversation, streaming, toolRunning }, options.onState)
  }

  readSignals()
  const scheduler = createRafScheduler(readSignals, 32)
  const observer = new MutationObserver(() => scheduler.schedule())
  observer.observe(body, {
    attributes: true,
    // `data-state`/`data-tool` are needed because a tool card changes state in
    // place (preparing -> running -> success) without a childList mutation.
    attributeFilter: ['data-phase', 'data-streaming', 'data-state', 'data-tool'],
    childList: true,
    subtree: true,
  })

  return () => {
    if (trailing !== undefined) clearTimeout(trailing)
    trailing = undefined
    scheduler.cancel()
    observer.disconnect()
  }
}

export const STATE_LABELS: Record<TaffyAgentState, string> = {
  idle: 'idle',
  thinking: 'thinking',
  'tool-calling': 'tool-calling',
  streaming: 'streaming',
  success: 'success',
  error: 'error',
}
