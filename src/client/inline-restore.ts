export interface InlineStyleSnapshot {
  key: string
  value: string
  priority: string
}

export function snapshotInlineStyles(element: HTMLElement, keys: readonly string[]): InlineStyleSnapshot[] {
  return keys.map((key) => ({
    key,
    value: element.style.getPropertyValue(key),
    priority: element.style.getPropertyPriority(key),
  }))
}

export function restoreInlineStyles(element: HTMLElement, snapshot: readonly InlineStyleSnapshot[]): void {
  for (const entry of snapshot) {
    if (entry.value === '') element.style.removeProperty(entry.key)
    else element.style.setProperty(entry.key, entry.value, entry.priority)
  }
}
