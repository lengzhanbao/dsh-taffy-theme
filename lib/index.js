import { DEFAULT_SETTINGS, PluginConfig, SETTINGS_NAMESPACE, TaffySettingsSchema } from './config.js';
import { registerAssetRoute } from './assets/route.js';
import { loadTaffySystemPrompt } from './prompt/loader.js';
import { injectBootTaffy } from './boot-taffy.js';
export const name = '@dsh-external/dsh-taffy-theme';
export const inject = ['webServer'];
export const Config = PluginConfig;
export { DEFAULT_SETTINGS, SETTINGS_NAMESPACE, loadTaffySystemPrompt, TaffySettingsSchema };
/** Host half serves plugin art and injects a pre-paint veil to avoid FOUC. */
export function apply(ctx) {
    ctx.effect(() => registerAssetRoute(ctx), 'dsh-taffy-theme: assets');
    ctx.inject(['webServer'], (webCtx) => {
        webCtx.effect(() => webCtx.webServer.tapIndex((html) => injectBootTaffy(html)), 'dsh-taffy-theme: boot veil');
    });
}
//# sourceMappingURL=index.js.map