import { CHAT_FLOW_SELECTOR, COMPOSER_CARD_SELECTOR, COMPOSER_OVERLAY_SELECTOR, CONVERSATION_SCROLL_SELECTOR, CONVERSATION_SELECTOR, DETAILS_SELECTOR, HERO_SELECTOR, SIDEBAR_SELECTOR, } from './chrome-selectors';
import { restoreInlineStyles, snapshotInlineStyles } from './inline-restore';
import { stampMetrics } from './metrics-stamp';
export const CONVERSATION_METRIC_KEYS = [
    '--taffy-conversation-left',
    '--taffy-conversation-top',
    '--taffy-conversation-width',
    '--taffy-conversation-height',
    '--taffy-conversation-content-left',
    '--taffy-conversation-content-width',
    '--taffy-conversation-viewport-top',
    '--taffy-conversation-viewport-height',
    '--taffy-content-left',
    '--taffy-content-width',
    '--taffy-viewport-top',
    '--taffy-viewport-height',
    '--taffy-frame-left',
    '--taffy-frame-top',
    '--taffy-frame-width',
    '--taffy-frame-height',
    '--taffy-frame-right-inset',
    '--taffy-composer-top',
    '--taffy-composer-height',
];
export const FRAME_COMPACT_WIDTH = 420;
export const FRAME_HIDDEN_MIN = 48;
export const FRAME_PAD_X = 4;
export const FRAME_PAD_Y = 4;
export const FRAME_SHELL_INSET = 0;
export function computeFrameBox(rects) {
    const { shell, content, viewport, composer } = rects;
    const viewportLeft = typeof viewport.left === 'number' ? viewport.left : content.left;
    const viewportWidth = typeof viewport.width === 'number' && viewport.width > 40 ? viewport.width : content.width;
    let left = viewportLeft - FRAME_PAD_X;
    let right = viewportLeft + viewportWidth + FRAME_PAD_X;
    let top = viewport.top - FRAME_PAD_Y;
    let bottom = viewport.top + viewport.height + FRAME_PAD_Y;
    if (content.width > 40) {
        left = Math.min(left, content.left - FRAME_PAD_X);
        right = Math.max(right, content.left + content.width + FRAME_PAD_X);
    }
    if (composer && composer.width > 40 && composer.height > 24) {
        left = Math.min(left, composer.left - FRAME_PAD_X);
        right = Math.max(right, composer.left + composer.width + FRAME_PAD_X);
        top = Math.min(top, composer.top - FRAME_PAD_Y);
        bottom = Math.max(bottom, composer.top + composer.height + FRAME_PAD_Y);
    }
    const shellLeft = shell.left + FRAME_SHELL_INSET;
    const shellTop = shell.top + FRAME_SHELL_INSET;
    const shellRight = shell.left + shell.width - FRAME_SHELL_INSET;
    const shellBottom = shell.top + shell.height - FRAME_SHELL_INSET;
    left = Math.max(left, shellLeft);
    top = Math.max(top, shellTop);
    right = Math.min(right, shellRight);
    bottom = Math.min(bottom, shellBottom);
    if (right - left < FRAME_HIDDEN_MIN || bottom - top < FRAME_HIDDEN_MIN) {
        return {
            left: Math.round(shellLeft),
            top: Math.round(shellTop),
            width: Math.max(0, Math.round(shellRight - shellLeft)),
            height: Math.max(0, Math.round(shellBottom - shellTop)),
        };
    }
    return {
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(right - left),
        height: Math.round(bottom - top),
    };
}
const TRACKED_SELECTOR = [
    CONVERSATION_SELECTOR,
    CHAT_FLOW_SELECTOR,
    CONVERSATION_SCROLL_SELECTOR,
    COMPOSER_CARD_SELECTOR,
    COMPOSER_OVERLAY_SELECTOR,
    HERO_SELECTOR,
    SIDEBAR_SELECTOR,
    DETAILS_SELECTOR,
    "[data-phase='active']",
].join(', ');
function asElement(node) {
    return node instanceof HTMLElement ? node : null;
}
function visibleWidth(node) {
    return node ? node.getBoundingClientRect().width : 0;
}
export function findConversationPane(doc) {
    const preferred = asElement(doc.querySelector("[data-pane='conversation']"));
    if (preferred && visibleWidth(preferred) > 0)
        return preferred;
    const candidates = [...doc.querySelectorAll(CONVERSATION_SELECTOR)].filter((node) => {
        return node instanceof HTMLElement;
    });
    let best = null;
    let bestWidth = 0;
    for (const node of candidates) {
        const width = node.getBoundingClientRect().width;
        if (width > bestWidth) {
            best = node;
            bestWidth = width;
        }
    }
    return best;
}
export function findChatFlow(shell) {
    const scoped = asElement(shell.querySelector(CHAT_FLOW_SELECTOR));
    if (scoped && visibleWidth(scoped) > 0)
        return scoped;
    const global = asElement(shell.ownerDocument.querySelector(CHAT_FLOW_SELECTOR));
    return global && visibleWidth(global) > 0 ? global : null;
}
export function findConversationScroll(shell) {
    const scoped = asElement(shell.querySelector(CONVERSATION_SCROLL_SELECTOR));
    if (scoped && scoped.getBoundingClientRect().height > 0)
        return scoped;
    return asElement(shell.ownerDocument.querySelector(CONVERSATION_SCROLL_SELECTOR));
}
export function findContentColumn(shell) {
    const phaseRoot = asElement(shell.querySelector('[data-phase]'));
    const hero = shell.matches(HERO_SELECTOR) || phaseRoot?.getAttribute('data-phase') === 'hero';
    if (hero) {
        const composer = asElement(shell.querySelector(COMPOSER_CARD_SELECTOR));
        if (composer && visibleWidth(composer) > 0)
            return composer;
    }
    return findChatFlow(shell) ?? findConversationScroll(shell) ?? shell;
}
export function findViewportColumn(shell, content) {
    const phaseRoot = asElement(shell.querySelector('[data-phase]'));
    const hero = shell.matches(HERO_SELECTOR) || phaseRoot?.getAttribute('data-phase') === 'hero';
    if (hero)
        return content;
    return findConversationScroll(shell) ?? shell;
}
export function findComposerCard(shell) {
    const scoped = asElement(shell.querySelector(COMPOSER_CARD_SELECTOR));
    if (scoped && visibleWidth(scoped) > 0)
        return scoped;
    const global = asElement(shell.ownerDocument.querySelector(COMPOSER_CARD_SELECTOR));
    return global && visibleWidth(global) > 0 ? global : null;
}
export function writeConversationRect(body, rect) {
    writeConversationMetrics(body, { shell: rect, content: rect, viewport: rect });
}
export function writeConversationMetrics(body, rects) {
    const hidden = rects.content.width < FRAME_HIDDEN_MIN || rects.viewport.height < FRAME_HIDDEN_MIN;
    body.style.setProperty('--taffy-conversation-left', `${Math.round(rects.shell.left)}px`);
    body.style.setProperty('--taffy-conversation-top', `${Math.round(rects.shell.top)}px`);
    body.style.setProperty('--taffy-conversation-width', `${Math.round(rects.shell.width)}px`);
    body.style.setProperty('--taffy-conversation-height', `${Math.round(rects.shell.height)}px`);
    body.style.setProperty('--taffy-conversation-content-left', `${Math.round(rects.content.left)}px`);
    body.style.setProperty('--taffy-conversation-content-width', `${Math.round(rects.content.width)}px`);
    body.style.setProperty('--taffy-conversation-viewport-top', `${Math.round(rects.viewport.top)}px`);
    body.style.setProperty('--taffy-conversation-viewport-height', `${Math.round(rects.viewport.height)}px`);
    body.style.setProperty('--taffy-content-left', `${Math.round(rects.content.left)}px`);
    body.style.setProperty('--taffy-content-width', `${Math.round(rects.content.width)}px`);
    body.style.setProperty('--taffy-viewport-top', `${Math.round(rects.viewport.top)}px`);
    body.style.setProperty('--taffy-viewport-height', `${Math.round(rects.viewport.height)}px`);
    const frame = computeFrameBox(rects);
    body.style.setProperty('--taffy-frame-left', `${frame.left}px`);
    body.style.setProperty('--taffy-frame-top', `${frame.top}px`);
    body.style.setProperty('--taffy-frame-width', `${frame.width}px`);
    body.style.setProperty('--taffy-frame-height', `${frame.height}px`);
    const composerTop = rects.composer && rects.composer.height > 24
        ? Math.round(rects.composer.top)
        : frame.top + frame.height;
    const composerHeight = rects.composer && rects.composer.height > 24
        ? Math.round(rects.composer.height)
        : 0;
    body.style.setProperty('--taffy-composer-top', `${composerTop}px`);
    body.style.setProperty('--taffy-composer-height', `${composerHeight}px`);
    const vw = body.ownerDocument.defaultView?.innerWidth ?? 0;
    const fromContent = rects.content.width > 40
        ? Math.max(0, Math.round(vw - (rects.content.left + rects.content.width)))
        : 0;
    body.style.setProperty('--taffy-frame-right-inset', `${fromContent}px`);
    body.toggleAttribute('data-taffy-frame-hidden', hidden);
    body.toggleAttribute('data-taffy-frame-compact', !hidden && rects.content.width < FRAME_COMPACT_WIDTH);
}
export function clearConversationRect(body) {
    for (const key of CONVERSATION_METRIC_KEYS)
        body.style.removeProperty(key);
    body.removeAttribute('data-taffy-frame-hidden');
    body.removeAttribute('data-taffy-frame-compact');
}
function touchesTracked(node) {
    if (!(node instanceof Element))
        return false;
    return Element.prototype.matches.call(node, TRACKED_SELECTOR)
        || Element.prototype.querySelector.call(node, TRACKED_SELECTOR) !== null;
}
export function startConversationMetrics(doc, body) {
    const original = snapshotInlineStyles(body, CONVERSATION_METRIC_KEYS);
    let shell = null;
    let content = null;
    let viewport = null;
    let composer = null;
    let sidebar = null;
    let details = null;
    let raf = 0;
    let resizeObserver;
    let mutationObserver;
    let disposed = false;
    const syncObserved = (next, current) => {
        if (next === current)
            return current;
        if (current)
            resizeObserver?.unobserve(current);
        if (next)
            resizeObserver?.observe(next);
        return next;
    };
    const measure = () => {
        if (disposed)
            return;
        const nextShell = findConversationPane(doc);
        shell = syncObserved(nextShell, shell);
        if (!shell) {
            content = syncObserved(null, content);
            viewport = syncObserved(null, viewport);
            composer = syncObserved(null, composer);
            sidebar = syncObserved(null, sidebar);
            details = syncObserved(null, details);
            body.setAttribute('data-taffy-frame-hidden', '');
            body.removeAttribute('data-taffy-frame-compact');
            for (const key of CONVERSATION_METRIC_KEYS)
                body.style.removeProperty(key);
            return;
        }
        const nextContent = findContentColumn(shell);
        const nextViewport = findViewportColumn(shell, nextContent);
        const nextComposer = findComposerCard(shell);
        content = syncObserved(nextContent, content);
        viewport = syncObserved(nextViewport, viewport);
        composer = syncObserved(nextComposer, composer);
        sidebar = syncObserved(asElement(doc.querySelector(SIDEBAR_SELECTOR)), sidebar);
        details = syncObserved(asElement(doc.querySelector(DETAILS_SELECTOR)), details);
        writeConversationMetrics(body, {
            shell: shell.getBoundingClientRect(),
            content: nextContent.getBoundingClientRect(),
            viewport: nextViewport.getBoundingClientRect(),
            composer: nextComposer?.getBoundingClientRect() ?? null,
        });
        stampMetrics(doc, body);
    };
    const schedule = () => {
        if (disposed || raf)
            return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            measure();
        });
    };
    const onWindowResize = () => schedule();
    const dispose = () => {
        if (disposed)
            return;
        disposed = true;
        if (raf)
            cancelAnimationFrame(raf);
        raf = 0;
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        window.removeEventListener('resize', onWindowResize);
        window.visualViewport?.removeEventListener('resize', onWindowResize);
        restoreInlineStyles(body, original);
        body.removeAttribute('data-taffy-frame-hidden');
        body.removeAttribute('data-taffy-frame-compact');
    };
    try {
        resizeObserver = new ResizeObserver(schedule);
        mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    schedule();
                    return;
                }
                if (mutation.type !== 'childList')
                    continue;
                for (const node of mutation.addedNodes) {
                    if (touchesTracked(node)) {
                        schedule();
                        return;
                    }
                }
                for (const node of mutation.removedNodes) {
                    if (touchesTracked(node) || node === shell || node === content || node === viewport || node === composer) {
                        schedule();
                        return;
                    }
                }
            }
        });
        mutationObserver.observe(doc.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-phase', 'data-chat-flow', 'data-conversation-composer-overlay'],
        });
        window.addEventListener('resize', onWindowResize);
        window.visualViewport?.addEventListener('resize', onWindowResize);
        measure();
    }
    catch (error) {
        dispose();
        throw error;
    }
    return dispose;
}
//# sourceMappingURL=conversation-metrics.js.map