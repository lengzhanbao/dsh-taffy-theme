import type { TaffyAgentState } from './types'

const SUCCESS_HOLD_MS = 1200
const ERROR_HOLD_MS = 1600

let lastState: TaffyAgentState = 'idle'
let lastChangeAt = 0
let successTimer: ReturnType<typeof setTimeout> | undefined
let errorTimer: ReturnType<typeof setTimeout> | undefined

export function resetStateAdapter(): void {
  lastState = 'idle'
  lastChangeAt = 0
  if (successTimer) clearTimeout(successTimer)
  if (errorTimer) clearTimeout(errorTimer)
  successTimer = undefined
  errorTimer = undefined
}

function scheduleFlash(next: 'success' | 'error', holdMs: number, onState: (s: TaffyAgentState) => void): void {
  const timerRef = next === 'success' ? 'successTimer' : 'errorTimer'
  const existing = next === 'success' ? successTimer : errorTimer
  if (existing) clearTimeout(existing)
  onState(next)
  const timer = setTimeout(() => onState('idle'), holdMs)
  if (timerRef === 'successTimer') successTimer = timer
  else errorTimer = timer
}

export function mapRuntimeState(input: unknown): TaffyAgentState {
  if (typeof input === 'string') {
    switch (input) {
      case 'idle':
      case 'thinking':
      case 'tool-calling':
      case 'streaming':
      case 'success':
      case 'error':
        return input
      case 'running':
      case 'generating':
        return 'streaming'
      case 'tool':
      case 'tool_call':
      case 'tool-call':
        return 'tool-calling'
      case 'reasoning':
        return 'thinking'
      default:
        return 'idle'
    }
  }
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>
    if (typeof record.state === 'string') return mapRuntimeState(record.state)
    if (typeof record.phase === 'string') return mapRuntimeState(record.phase)
    if (record.streaming === true) return 'streaming'
    if (record.thinking === true) return 'thinking'
    if (record.toolCalling === true) return 'tool-calling'
    if (record.success === true) return 'success'
    if (record.error === true) return 'error'
  }
  return 'idle'
}

export function mapDomSignals(signals: {
  activeConversation?: boolean
  composerPhase?: string | null
  streaming?: boolean
  hasToolCall?: boolean
  error?: boolean
  success?: boolean
}, onState: (s: TaffyAgentState) => void): TaffyAgentState {
  if (signals.success) {
    scheduleFlash('success', SUCCESS_HOLD_MS, onState)
    lastState = 'success'
    return lastState
  }
  if (signals.error) {
    scheduleFlash('error', ERROR_HOLD_MS, onState)
    lastState = 'error'
    return lastState
  }

  let next: TaffyAgentState = 'idle'
  if (!signals.activeConversation) {
    next = 'idle'
  } else if (signals.streaming) {
    next = 'streaming'
  } else if (signals.hasToolCall) {
    next = 'tool-calling'
  } else if (signals.composerPhase === 'thinking' || signals.composerPhase === 'reasoning') {
    next = 'thinking'
  } else {
    next = 'idle'
  }

  const now = Date.now()
  if (next !== lastState && now - lastChangeAt > 80) {
    lastState = next
    lastChangeAt = now
    onState(next)
  }
  return lastState
}

export function debounceState(state: TaffyAgentState): TaffyAgentState {
  return state
}
