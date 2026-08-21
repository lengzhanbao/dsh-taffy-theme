import { describe, expect, it } from 'vitest'
import { mapRuntimeState, resetStateAdapter } from '../src/state/adapter.ts'

describe('state adapter', () => {
  it('maps known runtime strings', () => {
    expect(mapRuntimeState('streaming')).toBe('streaming')
    expect(mapRuntimeState('tool-calling')).toBe('tool-calling')
  })

  it('falls back to idle for unknown values', () => {
    expect(mapRuntimeState('unknown-phase')).toBe('idle')
    expect(mapRuntimeState(null)).toBe('idle')
  })

  it('resets flash timers cleanly', () => {
    resetStateAdapter()
    expect(mapRuntimeState('idle')).toBe('idle')
  })
})
