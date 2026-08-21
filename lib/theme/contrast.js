function channel(value) {
    const hex = value.replace('#', '');
    const normalized = hex.length === 3
        ? hex.split('').map((c) => c + c).join('')
        : hex.slice(0, 6);
    return parseInt(normalized, 16);
}
function luminance(hex) {
    const num = channel(hex);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const transform = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}
export function contrastRatio(foreground, background) {
    if (!foreground.startsWith('#') || !background.startsWith('#'))
        return 21;
    const l1 = luminance(foreground);
    const l2 = luminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
export function meetsTextContrast(foreground, background, large = false) {
    const ratio = contrastRatio(foreground, background);
    return large ? ratio >= 3 : ratio >= 4.5;
}
//# sourceMappingURL=contrast.js.map