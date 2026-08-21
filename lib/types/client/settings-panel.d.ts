import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'settings.general.item': {
            kind: 'list';
            scope: 'root';
        };
    }
}
export declare function registerSettingsPanel(ctx: ClientContext): void;
