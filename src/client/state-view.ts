import type { TaffyAgentState } from '../state/types'
import { mapDomSignals } from '../state/adapter'
import {
  ACTIVE_SELECTOR,
  CHAT_FLOW_SELECTOR,
  CONVERSATION_PHASE_SELECTOR,
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

  const readSignals = (): void => {
    const now = Date.now()
    if (now - lastEmitAt < AGENT_THROTTLE_MS) return
    const activeConversation = body.querySelector(ACTIVE_SELECTOR) !== null
    const chatFlow = body.querySelector(CHAT_FLOW_SELECTOR)
    // `data-phase` also exists on the composer with an unrelated domain, so the
    // conversation phase is resolved upwards from the chat flow.
    const conversationPhase =
      chatFlow?.closest(CONVERSATION_PHASE_SELECTOR)?.getAttribute('data-phase') ?? null
    const streaming = body.querySelector(STREAMING_SELECTOR) !== null
    // Only live tool execution counts; a transcript full of finished tool cards
    // must not report `tool-calling`.
    const toolRunning = body.querySelector(TOOL_RUNNING_SELECTOR) !== null
    lastEmitAt = now

    mapDomSignals({
      activeConversation,
      composerPhase: conversationPhase,
      streaming,
      hasToolCall: toolRunning,
      error: false,
      success: false,
    }, options.onState)
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
