import { sanitizeColorField } from '../assets/validate';
import { restoreInlineStyles, snapshotInlineStyles } from '../client/inline-restore';
const PRESETS = {
    'taffy-candy': {
        primary: '#f29bc2',
        secondary: '#493b50',
        accent: '#e7b957',
        background: '#fff7f1',
        surface: '#fffdfb',
        text: '#493b50',
        success: '#e7b957',
        warning: '#e7b957',
        error: '#c43c3c',
    },
    'taffy-night': {
        primary: '#f2a5c8',
        secondary: '#bfaeeb',
        accent: '#e7be62',
        background: '#211b32',
        surface: '#2a2340',
        text: '#fff4fa',
        success: '#e7be62',
        warning: '#e7be62',
        error: '#c43c3c',
    },
    'taffy-mint': {
        primary: '#f29bc2',
        secondary: '#91d5e8',
        accent: '#e7b957',
        background: '#f6fbfc',
        surface: '#ffffff',
        text: '#493b50',
        success: '#e7b957',
        warning: '#e7b957',
        error: '#c43c3c',
    },
};
const TAFFY_TOKEN_KEYS = [
    '--ds-taffy-pink',
    '--ds-taffy-charcoal',
    '--ds-taffy-gold',
    '--ds-taffy-ribbon',
    '--ds-taffy-text',
    '--taffy-pink',
    '--taffy-gold',
];
export function resolveThemeTokens(colors) {
    const base = colors.preset === 'custom'
        ? PRESETS['taffy-candy']
        : PRESETS[colors.preset];
    return {
        primary: sanitizeColorField(colors.primary) ?? base.primary,
        secondary: sanitizeColorField(colors.secondary) ?? base.secondary,
        accent: sanitizeColorField(colors.accent) ?? base.accent,
        background: sanitizeColorField(colors.background) ?? base.background,
        surface: sanitizeColorField(colors.surface) ?? base.surface,
        text: sanitizeColorField(colors.text) ?? base.text,
        success: sanitizeColorField(colors.success) ?? base.success,
        warning: sanitizeColorField(colors.warning) ?? base.warning,
        error: sanitizeColorField(colors.error) ?? base.error,
    };
}
export function snapshotThemeTokens(root) {
    return snapshotInlineStyles(root, TAFFY_TOKEN_KEYS);
}
export function applyThemeTokens(root, tokens) {
    root.style.setProperty('--ds-taffy-pink', tokens.primary);
    root.style.setProperty('--ds-taffy-charcoal', tokens.secondary);
    root.style.setProperty('--ds-taffy-gold', tokens.accent);
    root.style.setProperty('--ds-taffy-ribbon', tokens.error);
    root.style.setProperty('--ds-taffy-text', tokens.text);
    root.style.setProperty('--taffy-pink', tokens.primary);
    root.style.setProperty('--taffy-gold', tokens.accent);
}
export function restoreThemeTokens(root, snapshot) {
    restoreInlineStyles(root, snapshot);
}
//# sourceMappingURL=user-theme.js.map