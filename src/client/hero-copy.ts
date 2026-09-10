const HOST_HEADLINES = new Set([
  '探索未至之境',
  'Into the Unknown',
])
export const DEFAULT_HERO_HEADLINE = '关注塔菲喵！关注塔菲谢谢喵！'
/**
 * 0.1.5-rc.1 起官方删了 headlineText 类名，标题是标题组里的裸 span。
 * 用 hero 容器定位：先找 [data-phase='hero']，其下标题组第一个纯文本 span。
 */
export const HERO_SCOPE_SELECTOR = "[data-phase='hero']"

export interface HeroCopySync {
  apply: (root: ParentNode) => void
  restore: () => void
}

function isHeadlineCandidate(node: HTMLElement): boolean {
  // 预览 badge 是第二个 span（mono 小字），标题是第一个纯文本 span
  if (node.childElementCount > 0) return false
  return node.textContent !== null && node.textContent.trim().length > 0
}

function collectHeadlineNodes(root: ParentNode): HTMLElement[] {
  const out: HTMLElement[] = []
  const scopes = root instanceof HTMLElement && root.matches(HERO_SCOPE_SELECTOR)
    ? [root]
    : Array.from(root.querySelectorAll(HERO_SCOPE_SELECTOR))
  for (const scope of scopes) {
    if (!(scope instanceof HTMLElement)) continue
    // 标题组：含文本、紧邻预览 badge 的行内组；兜底扫整个 hero 区
    const groups = scope.querySelectorAll('span')
    for (const node of groups) {
      if (node instanceof HTMLElement && isHeadlineCandidate(node)) out.push(node)
    }
  }
  return out
}

/** DSH owns this text; keep an exact snapshot so plugin dispose restores it. */
export function createHeroCopySync(getHeadline: () => string = () => DEFAULT_HERO_HEADLINE): HeroCopySync {
  const originals = new Map<HTMLElement, { original: string, applied: string }>()

  return {
    apply(root: ParentNode): void {
      const headline = getHeadline()
      for (const node of collectHeadlineNodes(root)) {
        const text = node.textContent ?? ''
        const known = originals.get(node)
        // 只换官方默认文案：用户自定义标题 / 已替换的不碰
        if (known ? text !== known.applied : !HOST_HEADLINES.has(text.trim())) continue
        if (known) known.applied = headline
        else originals.set(node, { original: text, applied: headline })
        node.textContent = headline
      }
    },
    restore(): void {
      for (const [node, record] of originals) {
        if (node.isConnected && node.textContent === record.applied) node.textContent = record.original
      }
      originals.clear()
    },
  }
}

export function touchesHeroCopy(node: Node): boolean {
  if (!(node instanceof Element)) return false
  return node.matches(HERO_SCOPE_SELECTOR)
    || node.closest(HERO_SCOPE_SELECTOR) !== null
    || node.querySelector(HERO_SCOPE_SELECTOR) !== null
}
