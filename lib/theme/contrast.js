const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function expandHex(hex) {
    const body = hex.slice(1);
    if (body.length === 3)
        return body.split('').map((c) => c + c).join('');
    return body;
}
function parseHexChannel(hex) {
    if (!HEX_COLOR_RE.test(hex))
        return null;
    const normalized = expandHex(hex);
    const value = Number.parseInt(normalized, 16);
    return Number.isFinite(value) ? value : null;
}
function luminance(hex) {
    const num = parseHexChannel(hex);
    if (num === null)
        throw new TypeError(`Invalid hex color: ${hex}`);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const transform = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}
export function contrastRatio(foreground, background) {
    const l1 = luminance(foreground);
    const l2 = luminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
export function meetsTextContrast(foreground, background, large = false) {
    try {
        const ratio = contrastRatio(foreground, background);
        return large ? ratio >= 3 : ratio >= 4.5;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=contrast.js.map