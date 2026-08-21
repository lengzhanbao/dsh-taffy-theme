/**
 * Acrylic is CSS opt-in only. This runtime never writes surface attributes onto
 * host panes or third-party plugins. It only clears leftovers from older builds.
 */
export declare function startAcrylicSurfaces(doc: Document): () => void;
