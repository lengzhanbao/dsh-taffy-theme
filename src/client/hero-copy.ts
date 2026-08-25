const HOST_HEADLINE = '探索未至之境'
const TAFFY_HEADLINE = '关注塔菲喵！关注塔菲谢谢喵！'
export const HERO_TEXT_SELECTOR = "[class*='headlineText']"

export interface HeroCopySync {
  apply: (root: ParentNode) => void
  restore: () => void
}

/** DSH owns this text; keep an exact snapshot so plugin dispose restores it. */
export function createHeroCopySync(): HeroCopySync {
  const originals = new Map<HTMLElement, string>()

  return {
    apply(root: ParentNode): void {
      for (const node of root.querySelectorAll(HERO_TEXT_SELECTOR)) {
        if (!(node instanceof HTMLElement)) continue
        const text = node.textContent ?? ''
        if (text.trim() !== HOST_HEADLINE) continue
        if (!originals.has(node)) originals.set(node, text)
        node.textContent = TAFFY_HEADLINE
      }
    },
    restore(): void {
      for (const [node, text] of originals) {
        if (node.isConnected && node.textContent === TAFFY_HEADLINE) node.textContent = text
      }
      originals.clear()
    },
  }
}

export function touchesHeroCopy(node: Node): boolean {
  if (!(node instanceof Element)) return false
  return node.matches(HERO_TEXT_SELECTOR)
    || node.closest("[class*='headline']") !== null
    || node.querySelector(HERO_TEXT_SELECTOR) !== null
}
