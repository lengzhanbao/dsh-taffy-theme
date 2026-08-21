export const FALLBACK_AVATAR_STYLE = {
    background: '#e889b0',
};
export function createAvatarFallbackElement() {
    const el = document.createElement('div');
    el.className = 'dsh-taffy-avatar-fallback';
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: FALLBACK_AVATAR_STYLE.background,
    });
    return el;
}
//# sourceMappingURL=fallback.js.map