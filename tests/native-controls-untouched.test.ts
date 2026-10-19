import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Locks in the rule the last review settled: the three decoration levels must
 * only decorate *our own* layers. They must never touch DSH's native sidebar
 * controls — not their size, their icon, their click area or their events.
 *
 * This is a static guard, so it can run in CI. The live check (computed styles
 * and elementFromPoint) lives in the audit scripts and in the desktop
 * acceptance runbook; this one exists to stop the old rules coming back.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const SHEETS = readdirSync(join(root, "src/theme")).filter((f) => f.endsWith(".css"))

/** Selectors that *are* DSH's own sidebar controls. Deliberately narrow. */
const NATIVE_SIDEBAR = /(?:sidebarCol|data-pane='sidebar'|\[data-slot='sidebar\.settings'\])/
const IS_BUTTON = /button|\[role='button'\]/

/**
 * Properties that change layout, hit area, icon rendering or paint on a native
 * control. `color`, `animation` and `transition` are allowed: tinting text and
 * disabling motion do not move a control or intercept a click.
 */
const FORBIDDEN = [
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
  "display", "position", "inset", "top", "right", "bottom", "left",
  "font-size", "line-height", "overflow", "aspect-ratio", "border-radius",
  "opacity", "content", "background", "background-image", "background-color",
  "border", "border-color", "border-width", "box-shadow", "filter", "transform",
  "flex", "flex-basis", "z-index",
]

interface Rule { sheet: string; selector: string; props: string[] }

function rulesOf(sheet: string): Rule[] {
  const css = readFileSync(join(root, "src/theme", sheet), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\r\n/g, "\n")
  const out: Rule[] = []
  const re = /([^{}@]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    out.push({
      sheet,
      selector: m[1].replace(/\s+/g, " ").trim(),
      props: m[2].split(";").map((d) => d.split(":")[0].trim().toLowerCase()).filter(Boolean),
    })
  }
  return out
}

const all = SHEETS.flatMap(rulesOf)
const onNativeSidebarButtons = all.filter(
  (r) => IS_BUTTON.test(r.selector) && NATIVE_SIDEBAR.test(r.selector),
)

describe('native sidebar controls stay untouched', () => {
  it('no rule restyles a native sidebar button beyond text colour or motion', () => {
    const offenders: string[] = []
    for (const rule of onNativeSidebarButtons) {
      const bad = rule.props.filter((p) => FORBIDDEN.includes(p))
      if (bad.length > 0) offenders.push(`[${rule.sheet}] ${rule.selector.slice(0, 90)} → ${bad.join(', ')}`)
    }
    expect(offenders, `these rules change native control geometry or paint:\n${offenders.join('\n')}`).toEqual([])
  })

  it('no decoration-level selector mentions a native button', () => {
    const offenders = all
      .filter((r) => r.selector.includes('data-taffy-sidebar-ornate') && IS_BUTTON.test(r.selector))
      .map((r) => `[${r.sheet}] ${r.selector.slice(0, 90)}`)
    expect(offenders, `the ornate level must not target buttons:\n${offenders.join('\n')}`).toEqual([])
  })

  it('keeps the three level rules on our own layers', () => {
    const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
    // simple/bare hide the trim frame and its ornament children…
    expect(css).toContain(":not([data-taffy-sidebar-ornate]) [data-skin-chrome='sidebar-trim']")
    expect(css).toContain('data-taffy-sidebar-corner')
    // …and bare hides the whole layer.
    expect(css).toContain('[data-taffy-sidebar-bare]')
  })
})
