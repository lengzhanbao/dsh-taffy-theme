/**
 * Shipped Taffy asset quality gate. Fails the build when figures regress
 * (missing files, oversize, bad matting on light-theme left figure).
 *
 *   node scripts/verify-assets.mjs
 *
 * Emergency local bypass (never used in prepublishOnly):
 *   $env:SKIP_ASSET_GATES='1'
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ASSET_ROOT = join(ROOT, 'assets/taffy')
const MANIFEST = JSON.parse(readFileSync(join(ASSET_ROOT, 'manifest.json'), 'utf8'))
const BASELINE = JSON.parse(readFileSync(join(ASSET_ROOT, 'baseline.json'), 'utf8'))

if (process.env.SKIP_ASSET_GATES === '1') {
  console.log('verify-assets: SKIP_ASSET_GATES=1，跳过资产门控')
  process.exit(0)
}

let failures = 0
let checks = 0

function check(label, ok, detail = '') {
  checks++
  if (ok) return
  failures++
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

function within(actual, expected, pct) {
  const delta = expected * pct
  return actual >= expected - delta && actual <= expected + delta
}

function measureFigure(relPath, creamGate) {
  const script = join(ROOT, 'scripts/asset-metrics.py')
  const result = spawnSync(
    process.env.PYTHON ?? 'python',
    [script, join(ASSET_ROOT, relPath), creamGate ? 'cream' : 'plain'],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `asset-metrics failed for ${relPath}`)
  }
  return JSON.parse(result.stdout.trim())
}

function pickFigure(stem) {
  for (const ext of ['.webp', '.png']) {
    const rel = `${stem}${ext}`
    if (existsSync(join(ASSET_ROOT, rel))) return rel
  }
  return null
}

console.log(`资产门控：${BASELINE.assetSetVersion}`)

for (const entry of Object.values(MANIFEST.figures ?? {})) {
  const rel = entry.file
  check(`manifest figure 存在 ${rel}`, existsSync(join(ASSET_ROOT, rel)))
}

for (const file of Object.values(MANIFEST.wallpaper ?? {})) {
  check(`manifest wallpaper 存在 ${file}`, existsSync(join(ASSET_ROOT, file)))
}

for (const [rel, spec] of Object.entries(BASELINE.figures ?? {})) {
  const path = join(ASSET_ROOT, rel)
  if (!existsSync(path)) {
    const alt = pickFigure(rel.replace(/\.(webp|png)$/, ''))
    check(`figure 缺失 ${rel}`, false, alt ? `找到 ${alt} 但 baseline 未更新` : '文件不存在')
    continue
  }

  const metrics = measureFigure(rel, Boolean(spec.creamFringeGate))
  const limits = BASELINE.limits

  check(
    `${rel} 宽度`,
    within(metrics.width, spec.width, limits.widthPct),
    `${metrics.width} vs ${spec.width}`,
  )
  check(
    `${rel} 高度`,
    within(metrics.height, spec.height, limits.heightPct),
    `${metrics.height} vs ${spec.height}`,
  )

  const byteLimit = rel.startsWith('avatar') ? MANIFEST.limits.avatarBytes : MANIFEST.limits.imageBytes
  check(`${rel} 字节 ≤ manifest`, metrics.bytes <= byteLimit, `${metrics.bytes}`)
  check(
    `${rel} 字节相对 baseline`,
    metrics.bytes <= spec.bytes * (1 + limits.bytesPct),
    `${metrics.bytes} > ${Math.round(spec.bytes * (1 + limits.bytesPct))}`,
  )

  if (typeof spec.opaqueRatioMin === 'number') {
    check(`${rel} opaqueRatio`, metrics.opaqueRatio >= spec.opaqueRatioMin, String(metrics.opaqueRatio))
  }
  if (typeof spec.bboxAreaRatioMin === 'number') {
    check(`${rel} bboxAreaRatio`, metrics.bboxAreaRatio >= spec.bboxAreaRatioMin, String(metrics.bboxAreaRatio))
  }
  if (spec.creamFringeGate && typeof spec.darkEdgeRatioMax === 'number') {
    check(
      `${rel} 奶油底黑边 darkEdgeRatio ≤ ${spec.darkEdgeRatioMax}`,
      metrics.darkEdgeRatio <= spec.darkEdgeRatioMax,
      String(metrics.darkEdgeRatio),
    )
  }
}

for (const [rel, spec] of Object.entries(BASELINE.wallpaper ?? {})) {
  const path = join(ASSET_ROOT, rel)
  check(`wallpaper 存在 ${rel}`, existsSync(path))
  if (!existsSync(path)) continue
  const bytes = readFileSync(path).length
  check(`${rel} 字节 ≤ manifest`, bytes <= MANIFEST.limits.imageBytes, String(bytes))
  check(
    `${rel} 字节相对 baseline`,
    bytes <= spec.bytes * (1 + BASELINE.limits.bytesPct),
    `${bytes} > ${Math.round(spec.bytes * (1 + BASELINE.limits.bytesPct))}`,
  )
}

console.log(`\n${checks} 项检查，${failures} 项失败`)
if (failures > 0) process.exit(1)
