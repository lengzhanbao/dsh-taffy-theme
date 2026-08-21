const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))$/;
export function isSafeCssColor(value) {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 64)
        return false;
    if (/[;{}]/.test(trimmed))
        return false;
    return COLOR_RE.test(trimmed);
}
export function sanitizeColorField(value) {
    if (typeof value !== 'string')
        return undefined;
    return isSafeCssColor(value) ? value.trim() : undefined;
}
export function isAllowedImageMime(mime, allowed) {
    return allowed.includes(mime);
}
export function isAllowedImageProtocol(url) {
    if (url.startsWith('data:image/'))
        return true;
    if (url.startsWith('blob:'))
        return true;
    if (url.startsWith('/plugins/'))
        return true;
    if (/^https?:\/\/127\.0\.0\.1(?::\d+)?\//.test(url))
        return true;
    if (/^https?:\/\/localhost(?::\d+)?\//.test(url))
        return true;
    return false;
}
export function isWithinByteLimit(bytes, limit) {
    return Number.isFinite(bytes) && bytes > 0 && bytes <= limit;
}
//# sourceMappingURL=validate.js.map