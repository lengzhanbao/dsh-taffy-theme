/** Coalesce DOM work to one animation frame, optionally capped by a minimum interval. */
export function createRafScheduler(
  run: () => void,
  minIntervalMs = 0,
): {
  schedule: () => void
  flush: () => void
  cancel: () => void
  setMinInterval: (ms: number) => void
} {
  let raf = 0
  let timeout = 0
  let lastRun = 0
  let intervalMs = minIntervalMs

  const invoke = (): void => {
    lastRun = typeof performance !== 'undefined' ? performance.now() : Date.now()
    run()
  }

  const scheduleFrame = (): void => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      invoke()
    })
  }

  const schedule = (): void => {
    if (raf || timeout) return
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const elapsed = lastRun > 0 ? now - lastRun : intervalMs
    if (intervalMs > 0 && elapsed < intervalMs) {
      timeout = window.setTimeout(() => {
        timeout = 0
        scheduleFrame()
      }, intervalMs - elapsed)
      return
    }
    scheduleFrame()
  }

  return {
    schedule,
    flush: (): void => {
      if (raf) cancelAnimationFrame(raf)
      if (timeout) clearTimeout(timeout)
      raf = 0
      timeout = 0
      invoke()
    },
    cancel: (): void => {
      if (raf) cancelAnimationFrame(raf)
      if (timeout) clearTimeout(timeout)
      raf = 0
      timeout = 0
    },
    setMinInterval: (ms: number): void => {
      intervalMs = Math.max(0, ms)
    },
  }
}
