export function resolveTimePhase(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12)
        return 'morning';
    if (hour >= 12 && hour < 18)
        return 'afternoon';
    if (hour >= 18 && hour < 22)
        return 'evening';
    return 'night';
}
export function startTimePhaseTicker(onPhase) {
    let lastPhase = resolveTimePhase();
    onPhase(lastPhase);
    const tick = () => {
        const phase = resolveTimePhase();
        if (phase !== lastPhase) {
            lastPhase = phase;
            onPhase(phase);
        }
    };
    const interval = window.setInterval(tick, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
}
//# sourceMappingURL=time-theme.js.map