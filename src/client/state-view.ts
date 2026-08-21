import type { TaffyAgentState } from '../state/types'
import { mapDomSignals } from '../state/adapter'
import {
  ACTIVE_SELECTOR,
  CHAT_FLOW_SELECTOR,
  STREAMING_SELECTOR,
  TOOL_CALL_SELECTOR,
} from './chrome-selectors'
import { createRafScheduler } from './schedule'

export interface StateViewOptions {
  onState: (state: TaffyAgentState) => void
}

const AGENT_THROTTLE_MS = 120

export function createStateObserver(options: StateViewOptions): () => void {
  const body = document.body
  let lastEmitAt = 0

  const readSignals = (): void => {
    const activeConversation = body.querySelector(ACTIVE_SELECTOR) !== null
    const chatFlow = body.querySelector(CHAT_FLOW_SELECTOR)
    const composerPhase = chatFlow?.getAttribute('data-phase') ?? null
    const streaming = body.querySelector(STREAMING_SELECTOR) !== null
    const hasToolCall = body.querySelector(TOOL_CALL_SELECTOR) !== null

    const now = Date.now()
    if (now - lastEmitAt < AGENT_THROTTLE_MS) return
    lastEmitAt = now

    mapDomSignals({
      activeConversation,
      composerPhase,
      streaming,
      hasToolCall,
      error: false,
      success: false,
    }, options.onState)
  }

  readSignals()
  const scheduler = createRafScheduler(readSignals, 32)
  const observer = new MutationObserver(() => scheduler.schedule())
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-phase', 'data-streaming'],
    childList: true,
    subtree: true,
  })

  return () => {
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
