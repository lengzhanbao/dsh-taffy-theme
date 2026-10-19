import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../src/theme/contrast.ts'

/**
 * Ties the contrast gate to the palette that actually ships.
 *
 * `verify/baseline.json` holds a list of approved hex pairs, and
 * `scripts/verify-taffy.mjs` only re-checks those literals — so it cannot notice
 * a token being retuned in `tokens.css`. This suite reads the stylesheet itself
 * and measures whatever is really declared, which is what makes the gate
 * meaningful the next time the palette moves.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = readFileSync(join(root, 'src/theme/tokens.css'), 'utf8')

/** Pull one declaration block out of the stylesheet by its opening selector. */
function block(selector: string): string {
  const at = tokens.indexOf(selector)
  if (at === -1) throw new Error(`selector not found in tokens.css: ${selector}`)
  const open = tokens.indexOf('{', at)
  const close = tokens.indexOf('\n}', open)
  if (open === -1 || close === -1) throw new Error(`unterminated block: ${selector}`)
  return tokens.slice(open, close)
}

function token(source: string, name: string): string {
  const match = source.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`))
  if (match === null) throw new Error(`--${name} is not a plain hex value in this block`)
  return match[1]
}

const LIGHT = block('body[data-dsh-taffy-theme] {')
const DARK = block("body[data-dsh-taffy-theme][data-ds-dark-theme],")

const AA_TEXT = 4.5
/** WCAG 2.2 SC 1.4.11 for component boundaries, focus rings and icons. */
const AA_UI = 3

describe('shipped palette contrast', () => {
  const modes = [
    {
      name: 'Pearl Bloom (light)',
      source: LIGHT,
      surfaces: ['ds-taffy-cream', 'ds-taffy-layer-1', 'ds-taffy-cream-deep'],
    },
    {
      name: 'Astral Night (dark)',
      source: DARK,
      surfaces: ['ds-taffy-cream', 'ds-taffy-layer-1', 'ds-taffy-cream-deep'],
    },
  ]

  for (const mode of modes) {
    describe(mode.name, () => {
      const surfaces = mode.surfaces.map((name) => [name, token(mode.source, name)] as const)

      for (const level of ['ds-taffy-text', 'ds-taffy-text-secondary', 'ds-taffy-text-muted']) {
        const ink = token(mode.source, level)
        for (const [surfaceName, surface] of surfaces) {
          it(`${level} on ${surfaceName} clears AA`, () => {
            const ratio = contrastRatio(ink, surface)
            expect(
              ratio,
              `${ink} on ${surface} is ${ratio.toFixed(2)}:1, needs ${AA_TEXT}:1`,
            ).toBeGreaterThanOrEqual(AA_TEXT)
          })
        }
      }

      for (const accent of ['ds-taffy-pink-ui', 'ds-taffy-gold-ui', 'ds-taffy-blueviolet']) {
        const ink = token(mode.source, accent)
        for (const [surfaceName, surface] of surfaces) {
          it(`${accent} on ${surfaceName} clears the UI threshold`, () => {
            const ratio = contrastRatio(ink, surface)
            expect(
              ratio,
              `${ink} on ${surface} is ${ratio.toFixed(2)}:1, needs ${AA_UI}:1`,
            ).toBeGreaterThanOrEqual(AA_UI)
          })
        }
      }
    })
  }

  it('keeps the two modes genuinely different', () => {
    expect(token(LIGHT, 'ds-taffy-text')).not.toBe(token(DARK, 'ds-taffy-text'))
    expect(token(LIGHT, 'ds-taffy-cream')).not.toBe(token(DARK, 'ds-taffy-cream'))
  })
})
