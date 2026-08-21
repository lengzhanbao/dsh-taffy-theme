export function snapshotInlineStyles(element, keys) {
    return keys.map((key) => ({
        key,
        value: element.style.getPropertyValue(key),
        priority: element.style.getPropertyPriority(key),
    }));
}
export function restoreInlineStyles(element, snapshot) {
    for (const entry of snapshot) {
        if (entry.value === '')
            element.style.removeProperty(entry.key);
        else
            element.style.setProperty(entry.key, entry.value, entry.priority);
    }
}
//# sourceMappingURL=inline-restore.js.map