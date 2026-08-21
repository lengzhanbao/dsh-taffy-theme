import { DEFAULT_SETTINGS, SETTINGS_NAMESPACE, TaffySettingsSchema } from './config.js';
import { loadTaffySystemPrompt } from './prompt/loader.js';
export declare const name = "@dsh-external/dsh-taffy-theme";
export declare const inject: string[];
export declare const Config: import("schemastery").default<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export type HostConfig = Record<string, never>;
export { DEFAULT_SETTINGS, SETTINGS_NAMESPACE, loadTaffySystemPrompt, TaffySettingsSchema };
/** Host half is a no-op; theme + settings run in the browser client bundle. */
export declare function apply(): void;
