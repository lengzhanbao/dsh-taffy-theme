const SURFACE_ATTR = 'data-taffy-surface'
const OWNER_ATTR = 'data-taffy-surface-owner'

function clearOwnedSurface(element: HTMLElement): void {
  if (element.getAttribute(OWNER_ATTR) !== 'dsh-taffy-theme') return
  element.removeAttribute(OWNER_ATTR)
  element.removeAttribute(SURFACE_ATTR)
}

function clearOwnedSurfaces(doc: Document): void {
  for (const node of doc.querySelectorAll(`[${OWNER_ATTR}="dsh-taffy-theme"]`)) {
    if (node instanceof HTMLElement) clearOwnedSurface(node)
  }
}

/**
 * Acrylic is CSS opt-in only. This runtime never writes surface attributes onto
 * host panes or third-party plugins. It only clears leftovers from older builds.
 */
export function startAcrylicSurfaces(doc: Document): () => void {
  clearOwnedSurfaces(doc)
  return () => {
    clearOwnedSurfaces(doc)
  }
}
