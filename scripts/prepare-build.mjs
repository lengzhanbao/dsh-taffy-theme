#!/usr/bin/env node
/**
 * Platform-independent build preparation.
 *
 * `scripts/build.ps1` does this inline, but it also needs DSH_CHECKOUT and
 * mklink junctions, so it cannot run in CI or on Linux/macOS. These steps have
 * no such dependency: the theme CSS is inlined into the client bundle, and the
 * persona markdown is copied next to the compiled host loader.
 *
 * Keeping them here means `npm run build:ci` reproduces the same artifacts on
 * any platform, and the build-drift gate can compare a fresh build against the
 * committed lib/.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Read a file with line endings normalised, so the bundle is host-independent. */
const read = (relative) => readFileSync(join(ROOT, relative), 'utf8').replace(/\r\n/g, '\n')

const THEME_SHEETS = ['tokens', 'taffy-surfaces', 'taffy-badges', 'components', 'motion']
const EXPORT_NAMES = {
  tokens: 'tokensCss',
  'taffy-surfaces': 'surfacesCss',
  'taffy-badges': 'badgesCss',
  components: 'componentsCss',
  motion: 'motionCss',
}

const lines = THEME_SHEETS.map(
  (sheet) => `export const ${EXPORT_NAMES[sheet]} = ${JSON.stringify(read(`src/theme/${sheet}.css`))};`,
)
// No trailing newline: build.ps1 writes the same concatenation, and the two
// paths must stay byte-identical or the build-drift gate would flip-flop.
writeFileSync(join(ROOT, 'src/client/theme-css.ts'), lines.join('\n'))
console.log(`  theme-css.ts regenerated (${THEME_SHEETS.length} sheets)`)

mkdirSync(join(ROOT, 'lib/prompt'), { recursive: true })
copyFileSync(join(ROOT, 'src/prompt/taffy-system.md'), join(ROOT, 'lib/prompt/taffy-system.md'))
console.log('  lib/prompt/taffy-system.md synced')
