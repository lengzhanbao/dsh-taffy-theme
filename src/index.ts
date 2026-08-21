import { DEFAULT_SETTINGS, PluginConfig, SETTINGS_NAMESPACE, TaffySettingsSchema } from './config.js'
import { loadTaffySystemPrompt } from './prompt/loader.js'

export const name = '@dsh-external/dsh-taffy-theme'
export const inject: string[] = []

export const Config = PluginConfig
export type HostConfig = Record<string, never>

export { DEFAULT_SETTINGS, SETTINGS_NAMESPACE, loadTaffySystemPrompt, TaffySettingsSchema }

/** Host half is a no-op; theme + settings run in the browser client bundle. */
export function apply(): void {}
