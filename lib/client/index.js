import { resetStateAdapter } from '../state/adapter';
import { applyThemeTokens, restoreThemeTokens, resolveThemeTokens, snapshotThemeTokens } from '../theme/user-theme';
import { resolveTimePhase, startTimePhaseTicker } from '../theme/time-theme';
import { loadSettings, saveSettings, subscribeSettings } from './settings-store';
import { ensureStyleNode, removeStyleNode, updateStyleNode } from './styles';
import { startBackdropSync } from './backdrop';
import { startProjectedState } from './projected-state';
import { startSidebarMetrics } from './sidebar-metrics';
import { startConversationMetrics } from './conversation-metrics';
import { startAcrylicSurfaces } from './acrylic-surfaces';
import { createChromeObserver } from './chrome-observer';
import { applyRootAttributes, createCharacterStage, createStageCurtains, createTrims, removeOwnedChrome, syncStageArt, TAFFY_INLINE_STYLE_KEYS, } from './mount';
import { restoreInlineStyles, snapshotInlineStyles } from './inline-restore';
import { createStateObserver } from './state-view';
import { registerSettingsPanel } from './settings-panel';
export const name = '@dsh-external/dsh-taffy-theme';
export const inject = ['slots', 'locale'];
export function apply(ctx) {
    const body = document.body;
    const tokenSnapshot = snapshotThemeTokens(body);
    const inlineSnapshot = snapshotInlineStyles(body, TAFFY_INLINE_STYLE_KEYS);
    let settings = loadSettings();
    let state = 'idle';
    let chromeMounted = false;
    let stateObserver;
    let disposeTimePhase;
    let disposeSettingsSub;
    let disposeBackdrop;
    let disposeProjectedState;
    let disposeSidebarMetrics;
    let disposeConversationMetrics;
    let disposeAcrylicSurfaces;
    let disposeChromeObserver;
    const restoreHostStyles = () => {
        restoreThemeTokens(body, tokenSnapshot);
        restoreInlineStyles(body, inlineSnapshot);
    };
    const disposeChromeRuntime = () => {
        disposeBackdrop?.();
        disposeBackdrop = undefined;
        disposeProjectedState?.();
        disposeProjectedState = undefined;
        disposeSidebarMetrics?.();
        disposeSidebarMetrics = undefined;
        disposeConversationMetrics?.();
        disposeConversationMetrics = undefined;
        disposeAcrylicSurfaces?.();
        disposeAcrylicSurfaces = undefined;
        disposeChromeObserver?.();
        disposeChromeObserver = undefined;
    };
    const unmountChrome = () => {
        disposeChromeRuntime();
        removeOwnedChrome(document);
        chromeMounted = false;
    };
    const syncTheme = () => {
        updateStyleNode(document);
        if (!settings.enabled) {
            applyRootAttributes(body, settings, state);
            restoreHostStyles();
            return;
        }
        applyThemeTokens(body, resolveThemeTokens(settings.colors));
        applyRootAttributes(body, settings, state);
        if (settings.timePhaseEnabled)
            body.setAttribute('data-time-phase', resolveTimePhase());
        else
            body.removeAttribute('data-time-phase');
    };
    const mountStaticChrome = () => {
        if (chromeMounted) {
            syncStageArt(body, settings);
            if (!body.querySelector("[data-skin-chrome='taffy-top-curtain']")) {
                for (const node of createStageCurtains())
                    body.append(node);
            }
            return;
        }
        if (!settings.enabled)
            return;
        removeOwnedChrome(document);
        const stage = createCharacterStage(settings);
        if (stage)
            body.prepend(stage);
        for (const trim of createTrims())
            body.append(trim);
        disposeBackdrop = startBackdropSync(body);
        disposeProjectedState = startProjectedState(body);
        disposeSidebarMetrics = startSidebarMetrics(document);
        disposeConversationMetrics = startConversationMetrics(document, body);
        disposeAcrylicSurfaces = startAcrylicSurfaces(document);
        disposeChromeObserver = createChromeObserver({
            getSettings: () => settings,
            onNodes: () => undefined,
        }).disconnect;
        chromeMounted = true;
    };
    const ensureChrome = () => {
        if (!settings.enabled) {
            unmountChrome();
            return;
        }
        mountStaticChrome();
    };
    ctx.effect(() => {
        ensureStyleNode(document);
        syncTheme();
        ensureChrome();
        stateObserver = createStateObserver({
            onState: (next) => {
                state = next;
                if (settings.enabled)
                    body.setAttribute('data-taffy-state', state);
            },
        });
        disposeTimePhase = settings.timePhaseEnabled
            ? startTimePhaseTicker((phase) => body.setAttribute('data-time-phase', phase))
            : undefined;
        disposeSettingsSub = subscribeSettings((next) => {
            settings = next;
            syncTheme();
            ensureChrome();
        });
        return () => {
            stateObserver?.disconnect();
            disposeTimePhase?.();
            disposeSettingsSub?.();
            unmountChrome();
            resetStateAdapter();
            removeStyleNode(document);
            body.removeAttribute('data-dsh-taffy-theme');
            body.removeAttribute('data-taffy-state');
            body.removeAttribute('data-taffy-preset');
            body.removeAttribute('data-taffy-chat-active');
            body.removeAttribute('data-taffy-conversation-active');
            body.removeAttribute('data-taffy-workspace');
            body.removeAttribute('data-taffy-better-sidebar-open');
            body.removeAttribute('data-taffy-details-open');
            body.removeAttribute('data-taffy-settings-open');
            body.removeAttribute('data-dsh-floating-panel-open');
            body.removeAttribute('data-time-phase');
            body.removeAttribute('data-dsh-taffy-intensity');
            body.removeAttribute('data-dsh-taffy-motion');
            body.removeAttribute('data-dsh-taffy-reduced-motion');
            body.removeAttribute('data-taffy-veil');
            body.removeAttribute('data-taffy-acrylic-percent');
            body.removeAttribute('data-taffy-frame-opacity');
            body.removeAttribute('data-taffy-panel-opacity');
            body.removeAttribute('data-taffy-character-opacity');
            body.removeAttribute('data-taffy-hide-left');
            body.removeAttribute('data-taffy-hide-right');
            body.removeAttribute('data-taffy-hide-mascot');
            body.removeAttribute('data-taffy-right-crowded');
            body.removeAttribute('data-taffy-q-ready');
            delete body.dataset.taffySidebarSize;
            restoreHostStyles();
        };
    }, 'dsh-taffy-theme:lifecycle');
    registerSettingsPanel(ctx);
    if (!localStorage.getItem('dsh-taffy-theme:v1'))
        saveSettings(settings);
}
//# sourceMappingURL=index.js.map