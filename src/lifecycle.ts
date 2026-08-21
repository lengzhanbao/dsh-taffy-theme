export function createLifecycleDisposer(cleanups: Array<() => void>): () => void {
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    for (const cleanup of [...cleanups].reverse()) cleanup()
  }
}
