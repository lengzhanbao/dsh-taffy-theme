import { syncStageArt } from './mount'

export function applyBackdrop(body: HTMLElement): void {
  if (!body.hasAttribute('data-dsh-taffy-theme')) return
  syncStageArt(body)
}

export function startBackdropSync(body: HTMLElement): () => void {
  applyBackdrop(body)

  // Night/day art is re-synced from the official `theme/change` event (see
  // client/index.ts) rather than by watching `data-ds-dark-theme`: the host
  // presenter sets that attribute *because of* the same event, so observing it
  // was a second, indirect copy of one signal. Only this theme's own attributes
  // are observed here.
  const observer = new MutationObserver(() => applyBackdrop(body))
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-dsh-taffy-theme', 'data-taffy-preset'],
  })

  return () => {
    observer.disconnect()
  }
}
