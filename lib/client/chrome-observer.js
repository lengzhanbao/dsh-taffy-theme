import { decorateSidebar } from './mount';
import { SIDEBAR_SELECTOR, SKIN_OWNER } from './chrome-selectors';
function isSkinOwned(node) {
    return node instanceof Element
        && (node.getAttribute('data-skin-owner') === SKIN_OWNER
            || node.closest(`[data-skin-owner="${SKIN_OWNER}"]`) !== null);
}
function touchesSelector(node, selector) {
    return node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null);
}
export function createChromeObserver(options) {
    const sidebarNodes = new Map();
    const clearSidebar = (sidebar) => {
        for (const node of sidebarNodes.get(sidebar) ?? [])
            node.remove();
        sidebarNodes.delete(sidebar);
    };
    const maybeDecorateSidebar = () => {
        const settings = options.getSettings();
        if (!settings.enabled)
            return;
        const sidebar = document.querySelector(SIDEBAR_SELECTOR);
        if (!(sidebar instanceof HTMLElement))
            return;
        if (sidebar.querySelector(`[data-skin-owner="${SKIN_OWNER}"][data-taffy-mascot='sidebar']`))
            return;
        clearSidebar(sidebar);
        const nodes = decorateSidebar(settings, sidebar);
        sidebarNodes.set(sidebar, nodes);
        options.onNodes(nodes);
        options.onSidebarChange?.();
    };
    const observer = new MutationObserver((mutations) => {
        let sidebarChanged = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (isSkinOwned(node))
                        continue;
                    if (touchesSelector(node, SIDEBAR_SELECTOR))
                        sidebarChanged = true;
                }
            }
        }
        if (sidebarChanged)
            maybeDecorateSidebar();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    maybeDecorateSidebar();
    return {
        disconnect: () => {
            observer.disconnect();
            for (const sidebar of sidebarNodes.keys())
                clearSidebar(sidebar);
            sidebarNodes.clear();
        },
    };
}
//# sourceMappingURL=chrome-observer.js.map