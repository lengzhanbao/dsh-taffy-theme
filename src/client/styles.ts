import { tokensCss, surfacesCss, badgesCss, componentsCss, motionCss } from './theme-css'

export const STYLE_ID = 'dsh-taffy-theme-style'
export const THEME_CSS = `${tokensCss}\n${surfacesCss}\n${badgesCss}\n${componentsCss}\n${motionCss}`

export function ensureStyleNode(doc: Document): HTMLStyleElement {
  const existing = doc.getElementById(STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    // Reassigning the same large stylesheet forces a CSS parse on every settings commit.
    if (existing.textContent !== THEME_CSS) existing.textContent = THEME_CSS
    return existing
  }
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.setAttribute('data-dsh-taffy-theme', 'style')
  style.setAttribute('data-plugin-css', '@dsh-external/dsh-taffy-theme')
  style.textContent = THEME_CSS
  doc.head.append(style)
  return style
}

export function removeStyleNode(doc: Document): void {
  doc.getElementById(STYLE_ID)?.remove()
}
