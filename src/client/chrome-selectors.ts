/**
 * DSH public DOM API selectors — single source of truth for chrome hooks.
 *
 * Every anchor here was verified against real host builds (DSH 0.1.6-alpha.1
 * and 0.2.1-rc.2) by grepping the shipped `@deepseek-ai/*` bundles. Anchors
 * that matched nothing in either build — `data-pane`, `detailsCol`,
 * `_explorer` — were removed rather than kept as folklore.
 * See docs/COMPAT-0.2.x-2026-10-19.md.
 */

export const SKIN_OWNER = 'dsh-taffy-theme'

// Layout columns carry hashed CSS-module classes, so the substring is the only
// stable part (`pI_x6G_sidebarCol`, `pI_x6G_centerCol`).
export const SIDEBAR_SELECTOR = "[class*='sidebarCol']"
export const CONVERSATION_SELECTOR = "[class*='centerCol']"

// Right dock: verified on ui-sidebar-right (`[data-sidebar-right-panel]`) and
// ui-layout (`[data-rightbar-col]`).
export const DETAILS_SELECTOR = ':is([data-sidebar-right-panel], [data-rightbar-col])'

export const HERO_SELECTOR = "[data-phase='hero']"
export const ACTIVE_SELECTOR = "[data-phase='active']"
/**
 * The conversation root owns `data-phase` with the domain `hero | active |
 * settling`. The composer's contenteditable carries a *different* `data-phase`
 * domain (`plain | adjudicating | claimed | submitting`), so the phase must be
 * resolved from the chat flow upward — never read straight off `[data-chat-flow]`.
 */
export const CONVERSATION_PHASE_SELECTOR = '[data-phase]'
export const CHAT_FLOW_SELECTOR = '[data-chat-flow]'
export const CONVERSATION_SCROLL_SELECTOR = '[data-conversation-scroll]'
export const COMPOSER_OVERLAY_SELECTOR = '[data-conversation-composer-overlay]'
export const COMPOSER_CARD_SELECTOR = '[data-composer-card]'
export const INPUT_MIRROR_SELECTOR = '[data-input-mirror]'
export const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog'][aria-modal='true']"
export const TITLEBAR_SELECTOR = "[class*='titlebar'], header:has([role='tablist'])"
/** Any tablist; the host does not wrap it in a `<header>` element. */
export const WORKSPACE_SELECTOR = "[role='tablist']"
/** Sidebar collapse state lives on the layout frame, not on `<body>`. */
export const SIDEBAR_COLLAPSED_SELECTOR = '[data-sidebar-collapsed]'
export const BETTER_SIDEBAR_SELECTOR = '[data-dsh-better-sidebar]'
export const RIGHT_DOCK_SELECTOR = [
  DETAILS_SELECTOR,
  BETTER_SIDEBAR_SELECTOR,
  '[data-dsh-floating-panel]',
  '[data-plugin-root]',
].join(', ')
export const SIDEBAR_HEADER_SLOT = "[data-slot='sidebar.header']"
/**
 * Tool cards stay in the transcript for the whole session, so their *presence*
 * says nothing about the agent working right now. Only `running`/`preparing`
 * mark live execution (ui-tool computes
 * `state = preparing | running | stopped | error | …`).
 */
export const TOOL_RUNNING_SELECTOR =
  "[data-tool][data-state='running'], [data-tool][data-state='preparing']"
/** A tool card that finished with an error (`data-error` is set when state is `error`). */
export const TOOL_ERROR_SELECTOR = '[data-tool][data-error]'
export const STREAMING_SELECTOR = '[data-streaming="true"]'
