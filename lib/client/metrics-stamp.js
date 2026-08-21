import { ACTIVE_SELECTOR, CHAT_FLOW_SELECTOR, COMPOSER_CARD_SELECTOR, CONVERSATION_SELECTOR, HERO_SELECTOR, SIDEBAR_SELECTOR, } from './chrome-selectors';
import { STYLE_ID } from './styles';
const METRICS_OPT_OUT_KEY = 'dsh-taffy-theme:metrics';
const MISS_GRACE_MS = 3000;
let enabledGetter = () => true;
let selectorWarned = false;
let mountedAt = 0;
export function setMetricsEnabledGetter(getter) {
    enabledGetter = getter;
}
export function metricsStampingEnabled() {
    try {
        return localStorage.getItem(METRICS_OPT_OUT_KEY) !== '0';
    }
    catch {
        return true;
    }
}
export function selectorMisses(doc) {
    const misses = [];
    const required = [
        ['SIDEBAR_SELECTOR', SIDEBAR_SELECTOR],
        ['COMPOSER_CARD_SELECTOR', COMPOSER_CARD_SELECTOR],
        ['CONVERSATION_SELECTOR', CONVERSATION_SELECTOR],
    ];
    for (const [name, selector] of required) {
        if (!doc.querySelector(selector))
            misses.push(name);
    }
    if (doc.querySelector(HERO_SELECTOR) === null && doc.querySelector(ACTIVE_SELECTOR) === null) {
        misses.push('PHASE_SELECTOR');
    }
    if (doc.querySelector(ACTIVE_SELECTOR) !== null) {
        const flow = doc.querySelector(`${ACTIVE_SELECTOR} ${CHAT_FLOW_SELECTOR}`) ?? doc.querySelector(CHAT_FLOW_SELECTOR);
        if (!flow)
            misses.push('CHAT_FLOW_SELECTOR');
    }
    return misses;
}
function parsePx(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
export function readMetricsFromBody(body, enabled, scene) {
    const view = body.ownerDocument.defaultView;
    const computed = view?.getComputedStyle(body);
    const frameWidth = parsePx(computed?.getPropertyValue('--taffy-frame-width') ?? '0');
    const frameHeight = parsePx(computed?.getPropertyValue('--taffy-frame-height') ?? '0');
    let phase = 'unknown';
    if (body.querySelector(HERO_SELECTOR))
        phase = 'hero';
    else if (body.querySelector(ACTIVE_SELECTOR))
        phase = 'active';
    return {
        scene,
        at: new Date().toISOString(),
        enabled,
        selectorMisses: selectorMisses(body.ownerDocument),
        frameWidth: Math.round(frameWidth),
        frameHeight: Math.round(frameHeight),
        frameHidden: body.hasAttribute('data-taffy-frame-hidden'),
        frameCompact: body.hasAttribute('data-taffy-frame-compact'),
        phase,
        viewportWidth: view?.innerWidth ?? 0,
        viewportHeight: view?.innerHeight ?? 0,
    };
}
export function stampMetrics(doc, body, scene) {
    if (!metricsStampingEnabled())
        return;
    const node = doc.getElementById(STYLE_ID);
    if (!(node instanceof HTMLStyleElement))
        return;
    const payload = readMetricsFromBody(body, enabledGetter(), scene);
    node.setAttribute('data-taffy-metrics', JSON.stringify(payload));
    maybeWarnSelectorMisses(doc, payload.enabled);
}
function maybeWarnSelectorMisses(doc, enabled) {
    if (!enabled || selectorWarned)
        return;
    if (Date.now() - mountedAt < MISS_GRACE_MS)
        return;
    const misses = selectorMisses(doc);
    if (misses.length === 0)
        return;
    console.warn('[dsh-taffy-theme] selector miss:', misses.join(', '));
    selectorWarned = true;
}
export function clearMetricsStamp(doc) {
    doc.getElementById(STYLE_ID)?.removeAttribute('data-taffy-metrics');
}
export function resetMetricsStampState() {
    selectorWarned = false;
    mountedAt = Date.now();
}
//# sourceMappingURL=metrics-stamp.js.map