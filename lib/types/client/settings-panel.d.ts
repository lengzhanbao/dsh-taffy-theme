import type { Context as ClientContext } from '@deepseek-ai/cordis';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'settings.general.item': {
            kind: 'list';
            scope: 'root';
        };
    }
}
export declare function registerSettingsPanel(ctx: ClientContext): void;
