import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { DEFAULT_SETTINGS, PluginConfig, SETTINGS_NAMESPACE, TaffySettingsSchema } from './config.js'
import { registerAssetRoute } from './assets/route.js'
import { loadTaffySystemPrompt } from './prompt/loader.js'

export const name = '@dsh-external/dsh-taffy-theme'
export const inject = ['webServer']

export const Config = PluginConfig
export type HostConfig = Record<string, never>

export { DEFAULT_SETTINGS, SETTINGS_NAMESPACE, loadTaffySystemPrompt, TaffySettingsSchema }

/** Host half serves plugin art under /plugins/@dsh-external/dsh-taffy-theme/assets/. */
export function apply(ctx: Context): void {
  ctx.effect(() => registerAssetRoute(ctx), 'dsh-taffy-theme: assets')
}
