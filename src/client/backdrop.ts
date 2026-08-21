import { syncStageArt } from './mount'

export function applyBackdrop(body: HTMLElement): void {
  if (!body.hasAttribute('data-dsh-taffy-theme')) return
  syncStageArt(body)
}

export function startBackdropSync(body: HTMLElement): () => void {
  applyBackdrop(body)

  const observer = new MutationObserver(() => applyBackdrop(body))
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-ds-dark-theme', 'data-dsh-taffy-theme', 'data-taffy-preset'],
  })

  return () => {
    observer.disconnect()
  }
}
