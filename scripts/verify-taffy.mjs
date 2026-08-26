/**
 * Taffy theme static release gate.
 *
 *   node scripts/verify-taffy.mjs              static half only
 *   node scripts/verify-taffy.mjs capture/*.json   optional live metrics (scene field required)
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = JSON.parse(readFileSync(join(ROOT, 'verify/baseline.json'), 'utf8'))

let failures = 0
let checks = 0

function check(label, ok, detail = '') {
  checks++
  if (ok) return
  failures++
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

function eq(label, actual, expected) {
  check(label, Object.is(actual, expected), `实际 ${JSON.stringify(actual)}，期望 ${JSON.stringify(expected)}`)
}

function readText(path) {
  return readFileSync(join(ROOT, path), 'utf8')
}

function listFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) listFiles(full, acc)
    else acc.push(full)
  }
  return acc
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function channel(hex) {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized.slice(0, 6)
  return parseInt(expanded, 16)
}

function luminance(hex) {
  const num = channel(hex)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  const transform = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b)
}

function contrastRatio(foreground, background) {
  const l1 = luminance(foreground)
  const l2 = luminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function scanPatterns(label, text, patterns) {
  const body = stripComments(text)
  for (const { pattern, reason } of patterns) {
    const re = new RegExp(pattern, 'gm')
    if (re.test(body)) {
      check(`${label} 禁止 ${pattern}`, false, reason)
    }
  }
}

console.log('静态半：构建产物 / 标识 / 对比度 / 选择器卫生')

for (const rel of BASELINE.requiredPackageFiles) {
  check(`文件存在 ${rel}`, existsSync(join(ROOT, rel)))
}

const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
eq('package name', packageJson.name, BASELINE.packageId)

for (const rel of packageJson.files ?? []) {
  const target = join(ROOT, rel)
  if (rel.includes('*')) continue
  check(`package.files 存在 ${rel}`, existsSync(target))
}

const skin = JSON.parse(readFileSync(join(ROOT, 'skin.json'), 'utf8'))
eq('skin id', skin.id, BASELINE.skinId)
eq('skin package', skin.package, BASELINE.packageId)

const patch = readText('cordis.patch.yml')
check('cordis.patch 注册插件', patch.includes(`name: '${BASELINE.packageId}'`))
check('cordis.patch 无 @file:', !patch.includes('@file:'))

const hostSrc = readText('src/index.ts')
const clientSrc = readText('src/client/index.ts')
const stylesSrc = readText('src/client/styles.ts')
check('host name', hostSrc.includes(`export const name = '${BASELINE.packageId}'`))
check('host inject webServer', hostSrc.includes("inject = ['webServer']"))
check('host asset route', hostSrc.includes('registerAssetRoute'))
check('client name', clientSrc.includes(`export const name = '${BASELINE.packageId}'`))
check('style id', stylesSrc.includes(`export const STYLE_ID = '${BASELINE.styleId}'`))

if (existsSync(join(ROOT, 'lib/client.js'))) {
  const clientJs = readText('lib/client.js')
  check('client bundle id', clientJs.includes(BASELINE.packageId))
  // 构建漂移门禁：产物必须含最新源 CSS，否则说明改了 src/theme 没重新 build
  const themeMap = [
    ['tokens.css', 'tokensCss'],
    ['taffy-surfaces.css', 'surfacesCss'],
    ['taffy-badges.css', 'badgesCss'],
    ['components.css', 'componentsCss'],
    ['motion.css', 'motionCss'],
  ]
  const extractCss = (text, name) => {
    const m = text.match(new RegExp(name + '\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"', 's'))
    if (!m) return null
    try { return JSON.parse('"' + m[1] + '"') } catch { return null }
  }
  for (const [file, name] of themeMap) {
    const src = readText(`src/theme/${file}`).replace(/\r\n/g, '\n')
    const built = extractCss(clientJs, name)
    check(`lib 含最新 ${file}`, built !== null && built === src, built === null ? '产物未找到 ' + name : '源 CSS 与构建产物不一致，需重新 build')
  }
  const size = statSync(join(ROOT, 'lib/client.js')).size
  check(
    `lib/client.js 体积 ≤ ${BASELINE.clientJsMaxBytes}`,
    size <= BASELINE.clientJsMaxBytes,
    `${size} bytes`,
  )
}

for (const [fg, bg] of BASELINE.contrastPairs) {
  const ratio = contrastRatio(fg, bg)
  check(
    `对比度 ${fg} on ${bg}`,
    ratio >= BASELINE.contrastMinRatio,
    `ratio=${ratio.toFixed(2)}`,
  )
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'assets/taffy/manifest.json'), 'utf8'))
for (const figure of Object.values(manifest.figures ?? {})) {
  check(`manifest figure ${figure.file}`, existsSync(join(ROOT, 'assets/taffy', figure.file)))
}
for (const file of Object.values(manifest.wallpaper ?? {})) {
  check(`manifest wallpaper ${file}`, existsSync(join(ROOT, 'assets/taffy', file)))
}

const themeCss = readdirSync(join(ROOT, 'src/theme'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => readText(`src/theme/${file}`))
  .join('\n')

scanPatterns('theme CSS', themeCss, BASELINE.bannedCssPatterns)
check('user-theme 不写 --dsw-alias', !readText('src/theme/user-theme.ts').includes('--dsw-alias-'))
check('metrics-stamp 模块存在', existsSync(join(ROOT, 'src/client/metrics-stamp.ts')))
check('host config 使用 schemastery', readText('src/config.ts').includes("from 'schemastery'"))
check('package.json 声明 schemastery 依赖', readFileSync(join(ROOT, 'package.json'), 'utf8').includes('"schemastery"'))

const clientFiles = listFiles(join(ROOT, 'src/client')).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
for (const file of clientFiles) {
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/')
  scanPatterns(rel, readFileSync(file, 'utf8'), BASELINE.bannedClientPatterns)
}

const chromeSelectors = readText('src/client/chrome-selectors.ts')
for (const name of BASELINE.requiredChromeExports) {
  check(`chrome-selectors 导出 ${name}`, chromeSelectors.includes(`export const ${name}`))
}

const captureDir = join(ROOT, 'capture')
const captureArgs = process.argv.slice(2)
const captureFiles = captureArgs.length > 0
  ? captureArgs.map((arg) => resolve(process.cwd(), arg))
  : existsSync(captureDir)
    ? readdirSync(captureDir)
        .filter((name) => name.endsWith('.json') && !name.endsWith('.example.json') && name !== 'selector-audit.json')
        .map((name) => join(captureDir, name))
    : []

const liveCaptures = captureFiles.filter((file) => {
  if (!existsSync(file)) return false
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    return data && typeof data === 'object' && 'scene' in data
  } catch {
    return false
  }
})

if (liveCaptures.length > 0) {
  console.log('\n实况半：capture metrics')
  for (const file of liveCaptures) {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    const label = data.scene ?? file
    check(`${label} 含 scene`, typeof data.scene === 'string' && data.scene.length > 0)
    check(`${label} selectorMisses 为空`, Array.isArray(data.selectorMisses) && data.selectorMisses.length === 0, JSON.stringify(data.selectorMisses))
    if (typeof data.frameWidth === 'number') {
      check(`${label} frameWidth > 0`, data.frameWidth > 0, String(data.frameWidth))
      check(`${label} frameHeight > 0`, data.frameHeight > 0, String(data.frameHeight))
    }
    if (typeof data.enabled === 'boolean') {
      check(`${label} enabled=true`, data.enabled === true)
    }
    if (typeof data.phase === 'string') {
      check(`${label} phase`, data.phase === 'active' || data.phase === 'hero', data.phase)
    }
  }
}

console.log(`\n${checks} 项检查，${failures} 项失败`)
if (failures > 0) process.exit(1)
