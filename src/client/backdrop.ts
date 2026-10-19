import { syncStageArt } from './mount'
import type { TaffySettings } from '../state/types'

export function applyBackdrop(body: HTMLElement, getSettings?: () => TaffySettings): void {
  if (!body.hasAttribute('data-dsh-taffy-theme')) return
  // Pass the settings through whenever they are reachable: without them
  // syncStageArt falls back to the legacy single-wallpaper path and overwrites
  // the resolved hero slot, which is how the selectable art kept getting undone.
  syncStageArt(body, getSettings?.())
}

export function startBackdropSync(body: HTMLElement, getSettings?: () => TaffySettings): () => void {
  applyBackdrop(body, getSettings)

  // Night/day art is re-synced from the official `theme/change` event (see
  // client/index.ts) rather than by watching `data-ds-dark-theme`: the host
  // presenter sets that attribute *because of* the same event, so observing it
  // was a second, indirect copy of one signal. Only this theme's own attributes
  // are observed here.
  const observer = new MutationObserver(() => applyBackdrop(body, getSettings))
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-dsh-taffy-theme', 'data-taffy-preset'],
  })

  return () => {
    observer.disconnect()
  }
}
