import { DETAILS_SELECTOR, RIGHT_DOCK_SELECTOR, SIDEBAR_SELECTOR, SKIN_OWNER } from './chrome-selectors'
import { createRafScheduler } from './schedule'


function measureRightPanelWidth(doc: Document): number {
  const vw = doc.defaultView?.innerWidth ?? 0
  if (vw <= 0) return 0
  let leftEdge = vw
  let found = false
  for (const node of doc.querySelectorAll(RIGHT_DOCK_SELECTOR)) {
    if (!(node instanceof HTMLElement)) continue
    if (node.closest(`[data-skin-owner="${SKIN_OWNER}"]`)) continue
    const box = node.getBoundingClientRect()
    if (box.width < 160 || box.height < 120) continue
    if (box.left < vw * 0.5) continue
    if (box.left >= vw - 12) continue
    leftEdge = Math.min(leftEdge, box.left)
    found = true
  }
  return found ? Math.max(0, Math.round(vw - leftEdge)) : 0
}

export function startSidebarMetrics(doc: Document): () => void {
  const sheet = doc.createElement('style')
  sheet.dataset.skinChrome = 'sidebar-width-rule'
  sheet.dataset.skinOwner = SKIN_OWNER
  doc.head.append(sheet)
  sheet.sheet?.insertRule('body { --taffy-sidebar-width: 280px; --taffy-details-width: 0px; --taffy-right-panel-width: 0px; --taffy-sidebar-footer-height: 56px; }')
  const widthRule = sheet.sheet?.cssRules[0] as CSSStyleRule | undefined

  let sidebarObserver: ResizeObserver | undefined
  let dockObserver: ResizeObserver | undefined
  let currentSidebar: HTMLElement | null = null

  const writeSidebar = (width: number): void => {
    if (!widthRule) return
    const rounded = Math.max(0, Math.round(width))
    widthRule.style.setProperty('--taffy-sidebar-width', `${rounded}px`)
    const size = rounded <= 120 ? 'rail' : rounded <= 220 ? 'narrow' : 'wide'
    doc.body.dataset.taffySidebarSize = size
  }

  const writeFooter = (sidebar: HTMLElement): void => {
    if (!widthRule) return
    const slot = sidebar.querySelector("[data-slot='sidebar.settings']")
    const button = slot instanceof HTMLElement
      ? (slot.matches('button') ? slot : slot.querySelector('button') ?? slot)
      : sidebar.querySelector("button[aria-label='设置']")
    if (!(button instanceof HTMLElement) || button.getBoundingClientRect().height < 8) {
      widthRule.style.setProperty('--taffy-sidebar-footer-height', '56px')
      return
    }
    let cluster: HTMLElement = button
    const parent = button.parentElement
    if (parent instanceof HTMLElement && parent !== sidebar) {
      const parentBox = parent.getBoundingClientRect()
      const sidebarBox = sidebar.getBoundingClientRect()
      if (parentBox.height > 0 && parentBox.height < sidebarBox.height * 0.35) cluster = parent
    }
    const rounded = Math.max(44, Math.round(sidebar.getBoundingClientRect().bottom - cluster.getBoundingClientRect().top))
    widthRule.style.setProperty('--taffy-sidebar-footer-height', `${rounded}px`)
  }

  const writeRightPanel = (): void => {
    if (!widthRule) return
    const width = measureRightPanelWidth(doc)
    widthRule.style.setProperty('--taffy-details-width', `${width}px`)
    widthRule.style.setProperty('--taffy-right-panel-width', `${width}px`)
    doc.body.toggleAttribute('data-taffy-details-open', width > 40)
    doc.body.toggleAttribute('data-taffy-right-crowded', width > 380)
  }

  const attachSidebar = (sidebar: HTMLElement): void => {
    writeFooter(sidebar)
    if (currentSidebar === sidebar) return
    sidebarObserver?.disconnect()
    currentSidebar = sidebar
    writeSidebar(sidebar.getBoundingClientRect().width)
    writeFooter(sidebar)
    sidebarObserver = new ResizeObserver((entries) => {
      const entry = entries.at(-1)
      if (entry) writeSidebar(entry.contentRect.width)
      writeFooter(sidebar)
    })
    sidebarObserver.observe(sidebar)
  }

  const attachDocks = (): void => {
    dockObserver?.disconnect()
    dockObserver = new ResizeObserver(() => writeRightPanel())
    for (const node of doc.querySelectorAll(RIGHT_DOCK_SELECTOR)) {
      if (node instanceof HTMLElement) dockObserver.observe(node)
    }
    writeRightPanel()
  }

  const tryAttach = (): void => {
    const sidebar = doc.querySelector(SIDEBAR_SELECTOR)
    if (sidebar instanceof HTMLElement) attachSidebar(sidebar)
    attachDocks()
  }

  tryAttach()
  const scheduler = createRafScheduler(tryAttach, 48)
  const mutationObserver = new MutationObserver(() => scheduler.schedule())
  mutationObserver.observe(doc.body, { childList: true, subtree: true })
  doc.defaultView?.addEventListener('resize', writeRightPanel)

  return () => {
    scheduler.cancel()
    sidebarObserver?.disconnect()
    dockObserver?.disconnect()
    mutationObserver.disconnect()
    doc.defaultView?.removeEventListener('resize', writeRightPanel)
    sheet.remove()
    delete doc.body.dataset.taffySidebarSize
    doc.body.removeAttribute('data-taffy-details-open')
    doc.body.removeAttribute('data-taffy-right-crowded')
  }
}
