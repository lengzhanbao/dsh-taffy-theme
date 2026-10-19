import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapDomSignals, resetStateAdapter } from '../src/state/adapter.ts'

/**
 * Only idle / streaming / tool-calling are observable. The tests pin that the
 * reserved states (thinking, success, error) can never be produced, because a
 * theme that animates a state it cannot observe is lying to the user.
 */
describe('agent state adapter', () => {
  beforeEach(() => {
    resetStateAdapter()
  })

  it('is idle outside an active conversation, whatever else is set', () => {
    const onState = vi.fn()
    const result = mapDomSignals({ activeConversation: false, streaming: true, toolRunning: true }, onState)
    expect(result).toBe('idle')
    // `idle` is the resting state, so no *change* is emitted for it.
    expect(onState).not.toHaveBeenCalled()
  })

  it('reports streaming while a response is arriving', () => {
    const onState = vi.fn()
    mapDomSignals({ activeConversation: true, streaming: true, toolRunning: true }, onState)
    expect(onState).toHaveBeenCalledWith('streaming')
  })

  it('reports tool-calling for a live tool card', () => {
    const onState = vi.fn()
    mapDomSignals({ activeConversation: true, streaming: false, toolRunning: true }, onState)
    expect(onState).toHaveBeenCalledWith('tool-calling')
  })

  it('never produces a reserved state', () => {
    const onState = vi.fn()
    const combos = [
      { activeConversation: false, streaming: false, toolRunning: false },
      { activeConversation: true, streaming: false, toolRunning: true },
      { activeConversation: true, streaming: true, toolRunning: false },
      { activeConversation: true, streaming: true, toolRunning: true },
    ]
    for (const combo of combos) {
      resetStateAdapter()
      mapDomSignals(combo, onState)
    }
    const seen = onState.mock.calls.map(([state]) => state)
    expect(seen.length).toBeGreaterThan(0)
    for (const state of seen) {
      expect(['idle', 'streaming', 'tool-calling']).toContain(state)
    }
  })

  it('debounces a state change that arrives back-to-back', () => {
    const onState = vi.fn()
    mapDomSignals({ activeConversation: true, streaming: true }, onState)
    expect(onState).toHaveBeenCalledTimes(1)

    // Same tick: the flip is held back, and the reported state is unchanged.
    const held = mapDomSignals({ activeConversation: true, streaming: false }, onState)
    expect(held).toBe('streaming')
    expect(onState).toHaveBeenCalledTimes(1)
  })

  it('reset clears the remembered state', () => {
    mapDomSignals({ activeConversation: true, streaming: true }, () => undefined)
    resetStateAdapter()
    const onState = vi.fn()
    mapDomSignals({ activeConversation: true, streaming: true }, onState)
    expect(onState).toHaveBeenCalledWith('streaming')
  })
})
