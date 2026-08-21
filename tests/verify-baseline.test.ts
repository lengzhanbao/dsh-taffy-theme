import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { contrastRatio } from '../src/theme/contrast.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const verifyBaseline = JSON.parse(readFileSync(join(root, 'verify/baseline.json'), 'utf8'))
const assetBaseline = JSON.parse(readFileSync(join(root, 'assets/taffy/baseline.json'), 'utf8'))

describe('verify baselines', () => {
  it('lists required chrome selector exports', () => {
    const chrome = readFileSync(join(root, 'src/client/chrome-selectors.ts'), 'utf8')
    for (const name of verifyBaseline.requiredChromeExports) {
      expect(chrome, name).toContain(`export const ${name}`)
    }
  })

  it('keeps contrast pairs above the release threshold', () => {
    for (const [fg, bg] of verifyBaseline.contrastPairs) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(verifyBaseline.contrastMinRatio)
    }
  })

  it('pins left-light fringe gate for cream UI', () => {
    const left = assetBaseline.figures['left-light.webp']
    expect(left.creamFringeGate).toBe(true)
    expect(left.darkEdgeRatioMax).toBeLessThanOrEqual(0.03)
  })
})
