import { mapDomSignals } from '../state/adapter';
import { ACTIVE_SELECTOR, CHAT_FLOW_SELECTOR, STREAMING_SELECTOR, TOOL_CALL_SELECTOR, } from './chrome-selectors';
const AGENT_THROTTLE_MS = 120;
export function createStateObserver(options) {
    const body = document.body;
    let lastEmitAt = 0;
    const readSignals = () => {
        const activeConversation = body.querySelector(ACTIVE_SELECTOR) !== null;
        const chatFlow = body.querySelector(CHAT_FLOW_SELECTOR);
        const composerPhase = chatFlow?.getAttribute('data-phase') ?? null;
        const streaming = body.querySelector(STREAMING_SELECTOR) !== null;
        const hasToolCall = body.querySelector(TOOL_CALL_SELECTOR) !== null;
        const now = Date.now();
        if (now - lastEmitAt < AGENT_THROTTLE_MS)
            return;
        lastEmitAt = now;
        mapDomSignals({
            activeConversation,
            composerPhase,
            streaming,
            hasToolCall,
            error: false,
            success: false,
        }, options.onState);
    };
    readSignals();
    const observer = new MutationObserver(() => readSignals());
    observer.observe(body, {
        attributes: true,
        attributeFilter: ['data-phase', 'data-streaming'],
        childList: true,
        subtree: true,
    });
    return observer;
}
export const STATE_LABELS = {
    idle: 'idle',
    thinking: 'thinking',
    'tool-calling': 'tool-calling',
    streaming: 'streaming',
    success: 'success',
    error: 'error',
};
//# sourceMappingURL=state-view.js.map