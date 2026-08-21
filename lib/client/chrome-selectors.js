/** DSH public DOM API selectors — single source of truth for chrome hooks. */
export const SKIN_OWNER = 'dsh-taffy-theme';
export const SIDEBAR_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])";
export const DETAILS_SELECTOR = ":is([data-pane='details'], [class*='detailsCol'], [class*='_explorer']:not([class*='Body']):not([class*='body']))";
export const CONVERSATION_SELECTOR = ":is([data-pane='conversation'], [class*='centerCol'])";
export const HERO_SELECTOR = "[data-phase='hero']";
export const ACTIVE_SELECTOR = "[data-phase='active']";
export const CHAT_FLOW_SELECTOR = '[data-chat-flow]';
export const CONVERSATION_SCROLL_SELECTOR = '[data-conversation-scroll]';
export const COMPOSER_OVERLAY_SELECTOR = '[data-conversation-composer-overlay]';
export const COMPOSER_CARD_SELECTOR = '[data-composer-card]';
export const INPUT_MIRROR_SELECTOR = '[data-input-mirror]';
export const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog'][aria-modal='true']";
export const TITLEBAR_SELECTOR = "[class*='titlebar'], header:has([role='tablist'])";
export const WORKSPACE_SELECTOR = "header [role='tablist']";
export const BETTER_SIDEBAR_SELECTOR = '[data-dsh-better-sidebar]';
export const RIGHT_DOCK_SELECTOR = [
    DETAILS_SELECTOR,
    BETTER_SIDEBAR_SELECTOR,
    '[data-dsh-floating-panel]',
    '[data-plugin-root]',
].join(', ');
export const SIDEBAR_HEADER_SLOT = "[data-slot='sidebar.header']";
export const TOOL_CALL_SELECTOR = '[data-tool-call]';
export const STREAMING_SELECTOR = '[data-streaming="true"]';
//# sourceMappingURL=chrome-selectors.js.map