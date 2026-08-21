import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearConversationRect,
  findConversationPane,
  startConversationMetrics,
  writeConversationRect,
} from '../src/client/conversation-metrics.ts'

function mockRect(element: HTMLElement, rect: { left: number; top: number; width: number; height: number }): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: rect.left,
    y: rect.top,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON() { return this },
  } as DOMRect)
}

describe('conversation metrics', () => {
  afterEach(() => {
    document.body.replaceChildren()
    document.body.removeAttribute('style')
    document.body.removeAttribute('data-taffy-frame-hidden')
    document.body.removeAttribute('data-taffy-frame-compact')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('prefers data-pane=conversation over centerCol', () => {
    const center = document.createElement('div')
    center.className = 'centerCol_abc'
    const pane = document.createElement('div')
    pane.setAttribute('data-pane', 'conversation')
    mockRect(center, { left: 0, top: 0, width: 900, height: 700 })
    mockRect(pane, { left: 280, top: 12, width: 640, height: 700 })
    document.body.append(center, pane)
    expect(findConversationPane(document)).toBe(pane)
  })

  it('writes the real conversation rect onto body CSS variables', () => {
    writeConversationRect(document.body, { left: 280, top: 16, width: 720, height: 640 })
    expect(document.body.style.getPropertyValue('--taffy-conversation-left')).toBe('280px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-top')).toBe('16px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-width')).toBe('720px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-height')).toBe('640px')
    expect(document.body.hasAttribute('data-taffy-frame-hidden')).toBe(false)
    expect(document.body.hasAttribute('data-taffy-frame-compact')).toBe(false)
  })

  it('hides the frame when the pane is too small', () => {
    writeConversationRect(document.body, { left: 0, top: 0, width: 32, height: 32 })
    expect(document.body.hasAttribute('data-taffy-frame-hidden')).toBe(true)
  })

  it('marks compact when the pane is narrower than 420px', () => {
    writeConversationRect(document.body, { left: 80, top: 0, width: 360, height: 500 })
    expect(document.body.hasAttribute('data-taffy-frame-compact')).toBe(true)
  })

  it('updates after ResizeObserver and restores on dispose', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    let resizeCb: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resizeCb = callback
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    document.body.style.setProperty('--taffy-conversation-width', '111px')
    const center = document.createElement('div')
    center.className = 'centerCol'
    mockRect(center, { left: 240, top: 8, width: 800, height: 600 })
    document.body.append(center)

    const dispose = startConversationMetrics(document, document.body)
    expect(document.body.style.getPropertyValue('--taffy-conversation-left')).toBe('240px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-width')).toBe('800px')

    mockRect(center, { left: 96, top: 8, width: 500, height: 600 })
    resizeCb?.([], {} as ResizeObserver)
    expect(document.body.style.getPropertyValue('--taffy-conversation-left')).toBe('96px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-width')).toBe('500px')

    dispose()
    expect(document.body.style.getPropertyValue('--taffy-conversation-width')).toBe('111px')
    expect(document.body.hasAttribute('data-taffy-frame-hidden')).toBe(false)
  })

  it('rebinds after the center column is replaced', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    let mutateCb: MutationCallback | undefined
    vi.stubGlobal('MutationObserver', class {
      constructor(callback: MutationCallback) {
        mutateCb = callback
      }
      observe(): void {}
      disconnect(): void {}
    })
    vi.stubGlobal('ResizeObserver', class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    const first = document.createElement('div')
    first.className = 'centerCol'
    mockRect(first, { left: 200, top: 0, width: 700, height: 500 })
    document.body.append(first)
    const dispose = startConversationMetrics(document, document.body)

    const second = document.createElement('div')
    second.className = 'centerCol'
    mockRect(second, { left: 120, top: 0, width: 880, height: 500 })
    first.remove()
    document.body.append(second)
    mutateCb?.([{
      type: 'childList',
      addedNodes: [second] as unknown as NodeList,
      removedNodes: [first] as unknown as NodeList,
      target: document.body,
    } as MutationRecord], {} as MutationObserver)

    expect(findConversationPane(document)).toBe(second)
    expect(document.body.style.getPropertyValue('--taffy-conversation-left')).toBe('120px')
    dispose()
  })

  it('hides the frame when no conversation pane exists', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('ResizeObserver', class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })
    const dispose = startConversationMetrics(document, document.body)
    expect(document.body.hasAttribute('data-taffy-frame-hidden')).toBe(true)
    dispose()
    expect(document.body.hasAttribute('data-taffy-frame-hidden')).toBe(false)
  })

  it('disconnects observers on dispose', () => {
    const disconnects: string[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('ResizeObserver', class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void { disconnects.push('resize') }
    })
    vi.stubGlobal('MutationObserver', class {
      observe(): void {}
      disconnect(): void { disconnects.push('mutate') }
    })
    const center = document.createElement('div')
    center.className = 'centerCol'
    mockRect(center, { left: 200, top: 0, width: 700, height: 500 })
    document.body.append(center)
    const dispose = startConversationMetrics(document, document.body)
    dispose()
    expect(disconnects).toContain('resize')
    expect(disconnects).toContain('mutate')
  })

  it('clearConversationRect removes metric variables', () => {
    writeConversationRect(document.body, { left: 1, top: 2, width: 3, height: 4 })
    clearConversationRect(document.body)
    expect(document.body.style.getPropertyValue('--taffy-conversation-left')).toBe('')
    expect(document.body.style.getPropertyValue('--taffy-conversation-content-left')).toBe('')
    expect(document.body.style.getPropertyValue('--taffy-frame-left')).toBe('')
  })

  it('frames the chat-flow width and the scroll viewport height, not the tall flow', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('ResizeObserver', class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    const center = document.createElement('div')
    center.className = 'centerCol'
    const scroll = document.createElement('div')
    scroll.setAttribute('data-conversation-scroll', '')
    const flow = document.createElement('div')
    flow.setAttribute('data-chat-flow', '')
    mockRect(center, { left: 280, top: 0, width: 900, height: 800 })
    mockRect(scroll, { left: 280, top: 48, width: 900, height: 640 })
    mockRect(flow, { left: 360, top: 48, width: 720, height: 2400 })
    scroll.append(flow)
    center.append(scroll)
    document.body.append(center)

    const dispose = startConversationMetrics(document, document.body)
    expect(document.body.style.getPropertyValue('--taffy-conversation-left')).toBe('280px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-width')).toBe('900px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-content-left')).toBe('360px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-content-width')).toBe('720px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-viewport-top')).toBe('48px')
    expect(document.body.style.getPropertyValue('--taffy-conversation-viewport-height')).toBe('640px')
    expect(document.body.style.getPropertyValue('--taffy-content-left')).toBe('360px')
    expect(document.body.style.getPropertyValue('--taffy-content-width')).toBe('720px')
    expect(document.body.style.getPropertyValue('--taffy-viewport-top')).toBe('48px')
    expect(document.body.style.getPropertyValue('--taffy-viewport-height')).toBe('640px')
    const frameLeft = Number.parseInt(document.body.style.getPropertyValue('--taffy-frame-left'), 10)
    const frameWidth = Number.parseInt(document.body.style.getPropertyValue('--taffy-frame-width'), 10)
    const frameTop = Number.parseInt(document.body.style.getPropertyValue('--taffy-frame-top'), 10)
    const frameHeight = Number.parseInt(document.body.style.getPropertyValue('--taffy-frame-height'), 10)
    expect(frameLeft).toBeLessThanOrEqual(360)
    expect(frameLeft + frameWidth).toBeGreaterThanOrEqual(1080)
    expect(frameTop).toBeLessThanOrEqual(48)
    expect(frameTop + frameHeight).toBeGreaterThanOrEqual(688)
    dispose()
  })
})
