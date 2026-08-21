import { BUNDLED_AVATAR, BUNDLED_AVATAR_NIGHT, BUNDLED_LEFT_DARK, BUNDLED_LEFT_LIGHT, BUNDLED_PORTRAIT, BUNDLED_RIGHT_DARK, BUNDLED_RIGHT_LIGHT, BUNDLED_WALLPAPER_DARK, BUNDLED_WALLPAPER_LIGHT, } from '../client/bundled-assets';
import { BUNDLED_Q_BRAND, BUNDLED_Q_COMMAND, BUNDLED_Q_FACE, BUNDLED_Q_NEW, BUNDLED_Q_SEND, BUNDLED_Q_SETTINGS, BUNDLED_Q_STOP, } from '../client/bundled-q';
import { isAllowedImageProtocol } from './validate';
export function isNightScene(root = document.body) {
    return root.hasAttribute('data-ds-dark-theme')
        || root.getAttribute('data-taffy-preset') === 'taffy-night';
}
function pickImage(candidate, fallback) {
    return candidate && isAllowedImageProtocol(candidate) ? candidate : fallback;
}
export function resolveAvatarUrl(settings, custom, night = isNightScene()) {
    const fallback = night && BUNDLED_AVATAR_NIGHT ? BUNDLED_AVATAR_NIGHT : BUNDLED_AVATAR;
    const candidate = custom?.avatar
        ?? (settings.avatar !== 'default' ? settings.avatar : undefined)
        ?? fallback;
    return pickImage(candidate, fallback);
}
export function resolvePortraitUrl(settings, custom) {
    if (settings.portrait === 'off')
        return null;
    const candidate = custom?.portrait
        ?? (settings.portrait !== 'default' ? settings.portrait : undefined)
        ?? BUNDLED_PORTRAIT;
    return pickImage(candidate, BUNDLED_PORTRAIT);
}
export function resolveBannerUrl(settings, custom) {
    const candidate = custom?.banner;
    if (!candidate)
        return null;
    return isAllowedImageProtocol(candidate) ? candidate : null;
}
export function resolveWallpaperUrl(night) {
    const candidate = night ? BUNDLED_WALLPAPER_DARK : BUNDLED_WALLPAPER_LIGHT;
    return candidate && isAllowedImageProtocol(candidate) ? candidate : '';
}
export function resolvePortraitFallback() {
    return pickImage(BUNDLED_PORTRAIT, BUNDLED_AVATAR);
}
export function resolveFigureUrls(night) {
    const left = night ? BUNDLED_LEFT_DARK : BUNDLED_LEFT_LIGHT;
    const right = night ? BUNDLED_RIGHT_DARK : BUNDLED_RIGHT_LIGHT;
    return {
        left: pickImage(left, BUNDLED_PORTRAIT),
        right: pickImage(right, BUNDLED_PORTRAIT),
    };
}
export function resolveQChromeUrls(settings) {
    const avatar = resolveAvatarUrl(settings);
    const portrait = resolvePortraitUrl(settings) ?? avatar;
    return {
        face: pickImage(BUNDLED_Q_FACE, avatar),
        send: pickImage(BUNDLED_Q_SEND, avatar),
        stop: pickImage(BUNDLED_Q_STOP, avatar),
        newSession: pickImage(BUNDLED_Q_NEW, avatar),
        settings: pickImage(BUNDLED_Q_SETTINGS, avatar),
        brand: pickImage(BUNDLED_Q_BRAND, portrait),
        command: pickImage(BUNDLED_Q_COMMAND, portrait),
    };
}
//# sourceMappingURL=resolve.js.map