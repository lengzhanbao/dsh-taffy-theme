export declare const CONVERSATION_METRIC_KEYS: readonly ["--taffy-conversation-left", "--taffy-conversation-top", "--taffy-conversation-width", "--taffy-conversation-height", "--taffy-conversation-content-left", "--taffy-conversation-content-width", "--taffy-conversation-viewport-top", "--taffy-conversation-viewport-height", "--taffy-content-left", "--taffy-content-width", "--taffy-viewport-top", "--taffy-viewport-height", "--taffy-frame-left", "--taffy-frame-top", "--taffy-frame-width", "--taffy-frame-height", "--taffy-frame-right-inset", "--taffy-composer-top", "--taffy-composer-height"];
export declare const FRAME_COMPACT_WIDTH = 420;
export declare const FRAME_HIDDEN_MIN = 48;
export declare const FRAME_PAD_X = 4;
export declare const FRAME_PAD_Y = 4;
export declare const FRAME_SHELL_INSET = 0;
export declare function computeFrameBox(rects: {
    shell: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    content: {
        left: number;
        width: number;
    };
    viewport: {
        left?: number;
        top: number;
        width?: number;
        height: number;
    };
    composer?: {
        left: number;
        top: number;
        width: number;
        height: number;
    } | null;
}): {
    left: number;
    top: number;
    width: number;
    height: number;
};
export declare function findConversationPane(doc: Document): HTMLElement | null;
export declare function findChatFlow(shell: HTMLElement): HTMLElement | null;
export declare function findConversationScroll(shell: HTMLElement): HTMLElement | null;
export declare function findContentColumn(shell: HTMLElement): HTMLElement;
export declare function findViewportColumn(shell: HTMLElement, content: HTMLElement): HTMLElement;
export declare function findComposerCard(shell: HTMLElement): HTMLElement | null;
export declare function writeConversationRect(body: HTMLElement, rect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>): void;
export declare function writeConversationMetrics(body: HTMLElement, rects: {
    shell: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>;
    content: Pick<DOMRectReadOnly, 'left' | 'width'>;
    viewport: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>;
    composer?: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'> | null;
}): void;
export declare function clearConversationRect(body: HTMLElement): void;
export declare function startConversationMetrics(doc: Document, body: HTMLElement): () => void;
