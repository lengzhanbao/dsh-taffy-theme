const PHASE_BOUNDARIES = [6, 12, 18, 22];
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
function msUntilNextPhaseBoundary(date = new Date()) {
    const hour = date.getHours();
    const nextBoundary = PHASE_BOUNDARIES.find((boundary) => boundary > hour);
    const next = new Date(date);
    if (nextBoundary === undefined) {
        next.setDate(next.getDate() + 1);
        next.setHours(PHASE_BOUNDARIES[0], 0, 0, 0);
    }
    else {
        next.setHours(nextBoundary, 0, 0, 0);
    }
    return Math.max(1_000, next.getTime() - date.getTime());
}
export function startTimePhaseTicker(onPhase) {
    let lastPhase = resolveTimePhase();
    let timer = 0;
    onPhase(lastPhase);
    const tick = () => {
        const phase = resolveTimePhase();
        if (phase !== lastPhase) {
            lastPhase = phase;
            onPhase(phase);
        }
        timer = window.setTimeout(tick, msUntilNextPhaseBoundary());
    };
    timer = window.setTimeout(tick, msUntilNextPhaseBoundary());
    return () => window.clearTimeout(timer);
}
//# sourceMappingURL=time-theme.js.map