import type { TaffySettings } from '../state/types.js'

interface NavigatorMemory {
  deviceMemory?: number
}

/** When true, disable blur-heavy acrylic and extra motion work. */
export function shouldUseLowPower(settings: TaffySettings): boolean {
  if (settings.reducedMotion || settings.motion === 'off') return true
  if (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return true
  }

  const nav = navigator as Navigator & NavigatorMemory
  if (
    typeof nav.hardwareConcurrency === 'number'
    && nav.hardwareConcurrency <= 4
    && typeof nav.deviceMemory === 'number'
    && nav.deviceMemory <= 4
  ) {
    return true
  }

  return false
}
