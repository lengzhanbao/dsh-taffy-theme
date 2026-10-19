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
 * What a theme rule must not do to a native control: move it, resize it, hide
 * its icon, steal its clicks or replace what it paints.
 *
 * Paint is explicitly allowed since the chat-look round: the grey "new session"
 * button is repainted with theme colours on purpose. So `color`, `background`
 * and `border-color` may be set — but not `background-image`, which is how an
 * icon would be smuggled back in, and not any geometry, radius or pseudo content.
 */
const FORBIDDEN = [
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
  "display", "position", "inset", "top", "right", "bottom", "left",
  "font-size", "line-height", "overflow", "aspect-ratio", "border-radius",
  "opacity", "content", "background-image",
  "border", "border-width", "box-shadow", "filter", "transform",
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
  it('no rule restyles a native sidebar button beyond paint', () => {
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

  it('drives the three levels from one tri-state attribute', () => {
    const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
    for (const level of ['off', 'simple', 'full']) {
      expect(css, level).toContain(
        `[data-taffy-sidebar-decor='${level}'] [data-skin-chrome='sidebar-trim']`,
      )
    }
    // The old two-boolean scheme is what made "off" and "simple" identical.
    expect(css).not.toMatch(/sidebar-(ornate|bare)/)
  })

  it('gives the three levels visibly different rules', () => {
    const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
    const bodyFor = (level: string): string => {
      const at = css.indexOf(`[data-taffy-sidebar-decor='${level}'] [data-skin-chrome='sidebar-trim']`)
      if (at === -1) return ''
      const open = css.indexOf('{', at)
      const close = css.indexOf('\n}', open)
      return css.slice(open, close)
    }
    const off = bodyFor('off')
    const simple = bodyFor('simple')
    const full = bodyFor('full')
    expect(off).toContain('background-image: none')
    expect(simple).not.toBe(full)
    expect(off).not.toBe(simple)
    // "simple" is one hairline plus a short bottom glow; "full" frames all four
    // edges. Count the gradient layers so they cannot silently converge again.
    const layers = (body: string) => (body.match(/linear-gradient\(/g) ?? []).length
    expect(layers(simple)).toBe(2)
    expect(layers(full)).toBe(4)
  })

  it('cannot draw the frame outside the sidebar', () => {
    const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
    // Somewhere the trim layer must clip, or a mis-measured sidebar width lets
    // the frame paint outside the column.
    expect(css).toMatch(/\[data-skin-chrome='sidebar-trim'\]\s*\{[^}]*overflow:\s*hidden/)
  })

  it('keeps the watermark independent of the frame level', () => {
    const css = readFileSync(join(root, 'src/theme/components.css'), 'utf8')
    // Turning the frame off must not take the user's chosen watermark with it.
    expect(css).not.toMatch(/sidebar-decor='off'\][^{]*data-taffy-sidebar-watermark/)
  })
})
