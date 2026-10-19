import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapDomSignals, resetStateAdapter } from '../src/state/adapter.ts'
import { createStateObserver } from '../src/client/state-view.ts'
import {
  ACTIVE_SELECTOR,
  CONVERSATION_PHASE_SELECTOR,
  CONVERSATION_SELECTOR,
  DETAILS_SELECTOR,
  SIDEBAR_COLLAPSED_SELECTOR,
  SIDEBAR_SELECTOR,
  TOOL_RUNNING_SELECTOR,
  WORKSPACE_SELECTOR,
} from '../src/client/chrome-selectors.ts'

/**
 * Stage B — host DOM contract.
 *
 * The fixture mirrors the structures verified in the shipped DSH bundles
 * (0.1.6-alpha.1 and 0.2.1-rc.2). It pins the two things that were silently
 * wrong before: the right dock must be found via its real anchors, and
 * `tool-calling` must never be inferred from tool cards merely being present
 * in the transcript.
 */

const FIXTURE = `
  <div class="pI_x6G_sidebarCol" id="sidebar"></div>
  <div class="pI_x6G_centerCol" id="center">
    <div data-phase="active" id="conversation-root">
      <div data-chat-flow id="chat-flow"></div>
    </div>
    <div data-phase="plain" id="composer-input"></div>
  </div>
  <div data-sidebar-right-panel="push" data-sidebar-right-open data-rightbar-col id="right-dock"></div>
  <div role="tablist" id="tabs"></div>
  <div data-sidebar-collapsed id="layout-frame"></div>
`

function mount(html: string = FIXTURE): void {
  document.body.innerHTML = html
}

/** Tool cards as ui-tool renders them: `data-tool` + `data-state`. */
function toolCard(state: string, error = false): string {
  return `<div data-tool="bash" data-state="${state}"${error ? ' data-error' : ''}></div>`
}

describe('host DOM contract', () => {
  beforeEach(() => {
    resetStateAdapter()
    mount()
  })

  it('finds the layout columns by their hashed class names', () => {
    expect(document.querySelector(SIDEBAR_SELECTOR)?.id).toBe('sidebar')
    expect(document.querySelector(CONVERSATION_SELECTOR)?.id).toBe('center')
  })

  it('finds the right dock via the verified anchors, not the removed ones', () => {
    const dock = document.querySelector(DETAILS_SELECTOR)
    expect(dock?.id).toBe('right-dock')
    // The conversation column must not be mistaken for the dock.
    expect(document.querySelector(DETAILS_SELECTOR)?.id).not.toBe('center')
  })

  it('finds the workspace tablist without requiring a <header> wrapper', () => {
    expect(document.querySelector(WORKSPACE_SELECTOR)?.id).toBe('tabs')
  })

  it('reads the sidebar collapse marker from the layout frame', () => {
    expect(document.querySelector(SIDEBAR_COLLAPSED_SELECTOR)?.id).toBe('layout-frame')
    expect(document.body.hasAttribute('data-sidebar-collapsed')).toBe(false)
  })

  it('resolves the conversation phase from the root, never from the composer', () => {
    const chatFlow = document.getElementById('chat-flow')
    const phaseRoot = chatFlow?.closest(CONVERSATION_PHASE_SELECTOR)
    expect(phaseRoot?.id).toBe('conversation-root')
    expect(phaseRoot?.getAttribute('data-phase')).toBe('active')
    // The composer carries the same attribute name with a different domain;
    // closest() must not land on it.
    expect(phaseRoot?.id).not.toBe('composer-input')
  })

  describe('tool-calling must reflect live execution only', () => {
    it('ignores a transcript of finished tool cards', () => {
      mount(`
        <div class="pI_x6G_centerCol">
          <div data-phase="active">
            <div data-chat-flow></div>
            ${toolCard('success')}${toolCard('success')}${toolCard('stopped')}
            ${toolCard('error', true)}
          </div>
        </div>
      `)
      expect(document.querySelector(TOOL_RUNNING_SELECTOR)).toBeNull()

      const onState = vi.fn()
      mapDomSignals({
        activeConversation: true,
        streaming: false,
        hasToolCall: document.querySelector(TOOL_RUNNING_SELECTOR) !== null,
        error: false,
        success: false,
      }, onState)
      expect(onState).not.toHaveBeenCalledWith('tool-calling')
    })

    it('matches a running or preparing tool card', () => {
      mount(`
        <div class="pI_x6G_centerCol">
          <div data-phase="active">
            <div data-chat-flow></div>
            ${toolCard('success')}${toolCard('running')}
          </div>
        </div>
      `)
      expect(document.querySelector(TOOL_RUNNING_SELECTOR)).not.toBeNull()

      const onState = vi.fn()
      mapDomSignals({
        activeConversation: true,
        streaming: false,
        hasToolCall: document.querySelector(TOOL_RUNNING_SELECTOR) !== null,
        error: false,
        success: false,
      }, onState)
      expect(onState).toHaveBeenCalledWith('tool-calling')
    })

    it('prefers streaming while a response is arriving', () => {
      const onState = vi.fn()
      mapDomSignals({
        activeConversation: true,
        streaming: true,
        hasToolCall: true,
        error: false,
        success: false,
      }, onState)
      expect(onState).toHaveBeenCalledWith('streaming')
      expect(onState).not.toHaveBeenCalledWith('tool-calling')
    })
  })

  describe('state observer wiring', () => {
    it('reports tool-calling for a live tool card in the real observer', () => {
      mount(`
        <div class="pI_x6G_centerCol">
          <div data-phase="active">
            <div data-chat-flow></div>
            ${toolCard('running')}
          </div>
        </div>
      `)
      const onState = vi.fn()
      const dispose = createStateObserver({ onState })
      dispose()
      expect(onState).toHaveBeenCalledWith('tool-calling')
    })

    it('stays out of tool-calling for a finished transcript', () => {
      mount(`
        <div class="pI_x6G_centerCol">
          <div data-phase="active">
            <div data-chat-flow></div>
            ${toolCard('success')}
          </div>
        </div>
      `)
      const onState = vi.fn()
      const dispose = createStateObserver({ onState })
      dispose()
      expect(onState).not.toHaveBeenCalledWith('tool-calling')
    })

    it('reports idle outside any active conversation (empty state)', () => {
      mount('<div class="pI_x6G_sidebarCol"></div>')
      const onState = vi.fn()
      const dispose = createStateObserver({ onState })
      dispose()
      expect(onState).not.toHaveBeenCalled()
      expect(ACTIVE_SELECTOR).toBe("[data-phase='active']")
    })
  })
})
