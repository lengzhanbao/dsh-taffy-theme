import { describe, expect, it } from 'vitest'
import { STYLE_ID, ensureStyleNode, removeStyleNode } from '../src/client/styles.ts'

describe('style node lifecycle', () => {
  it('creates a single style node idempotently', () => {
    const doc = document.implementation.createHTMLDocument('test')
    const first = ensureStyleNode(doc)
    const second = ensureStyleNode(doc)
    expect(first).toBe(second)
    expect(doc.getElementById(STYLE_ID)).not.toBeNull()
    removeStyleNode(doc)
    expect(doc.getElementById(STYLE_ID)).toBeNull()
  })
})
