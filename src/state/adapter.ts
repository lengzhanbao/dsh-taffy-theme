import type { TaffyAgentState } from './types'

/**
 * Only three states have a signal the client can actually observe:
 *
 * - `idle`         — no active conversation, or nothing running inside it
 * - `streaming`    — `[data-streaming="true"]` (ui-chat)
 * - `tool-calling` — a tool card in `running`/`preparing` (ui-tool)
 *
 * `thinking`, `success` and `error` stay in {@link TaffyAgentState} as reserved
 * vocabulary but are deliberately **not** produced, because the host exposes no
 * signal for them:
 *
 * - the conversation root's `data-phase` domain is only `hero | active |
 *   settling`, and the composer's `data-phase` domain is `plain | adjudicating |
 *   claimed | submitting` — neither has a "thinking" value;
 * - a finished tool card keeps `data-error` set for the rest of the session, so
 *   deriving `error` from it would latch the theme into an error look;
 * - nothing reports a discrete tool *success* to the client.
 *
 * Showing nothing for those three is more honest than animating a state nobody
 * can observe.
 */

let lastState: TaffyAgentState = 'idle'
let lastChangeAt = 0

/** Minimum gap between state changes, so rapid mutations do not flicker. */
const CHANGE_DEBOUNCE_MS = 80

export function resetStateAdapter(): void {
  lastState = 'idle'
  lastChangeAt = 0
}

export function mapDomSignals(signals: {
  activeConversation?: boolean
  streaming?: boolean
  toolRunning?: boolean
}, onState: (s: TaffyAgentState) => void): TaffyAgentState {
  let next: TaffyAgentState = 'idle'
  if (!signals.activeConversation) next = 'idle'
  else if (signals.streaming) next = 'streaming'
  else if (signals.toolRunning) next = 'tool-calling'

  const now = Date.now()
  if (next !== lastState && now - lastChangeAt > CHANGE_DEBOUNCE_MS) {
    lastState = next
    lastChangeAt = now
    onState(next)
  }
  return lastState
}
