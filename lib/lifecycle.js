export function createLifecycleDisposer(cleanups) {
    let disposed = false;
    return () => {
        if (disposed)
            return;
        disposed = true;
        for (const cleanup of [...cleanups].reverse())
            cleanup();
    };
}
//# sourceMappingURL=lifecycle.js.map