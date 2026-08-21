#!/usr/bin/env node
/**
 * Verify npm pack tarball contains host-loadable files (no schemastery / missing config.js).
 */
import { execSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REQUIRED = [
  'package/lib/index.js',
  'package/lib/config.js',
  'package/lib/assets/route.js',
  'package/lib/assets/manifest.js',
  'package/lib/assets/trust-fence.js',
  'package/lib/client.js',
  'package/lib/prompt/loader.js',
  'package/lib/prompt/taffy-system.md',
  'package/cordis.patch.yml',
  'package/skin.json',
  'package/assets/taffy/wallpaper-light.webp',
  'package/assets/taffy/avatar.webp',
]

let failures = 0
let checks = 0

function check(label, ok, detail = '') {
  checks++
  if (ok) return
  failures++
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

const work = mkdtempSync(join(tmpdir(), 'taffy-pack-'))
const tgz = join(work, 'pack.tgz')

try {
  execSync('npm pack --pack-destination .', { cwd: ROOT, stdio: 'pipe' })
  const packed = readdirSync(ROOT).find((name) => name.endsWith('.tgz'))
  if (!packed) throw new Error('npm pack produced no .tgz')
  execSync(`tar -xf "${join(ROOT, packed)}" -C "${work}"`, { stdio: 'pipe' })
  rmSync(join(ROOT, packed), { force: true })

  console.log('pack 门控：tarball 内容 / host 可加载性')
  for (const rel of REQUIRED) {
    check(rel, existsSync(join(work, rel)))
  }

  const pkgRoot = join(work, 'package')
  const pkgJson = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'))
  check('package.json 声明 schemastery 依赖', Boolean(pkgJson.dependencies?.schemastery))
  check('package.files 含 lib/assets/route.js', (pkgJson.files ?? []).includes('lib/assets/route.js'))

  const hostIndex = readFileSync(join(pkgRoot, 'lib/index.js'), 'utf8')
  const routeSrc = readFileSync(join(pkgRoot, 'lib/assets/route.js'), 'utf8')
  const manifestSrc = readFileSync(join(pkgRoot, 'lib/assets/manifest.js'), 'utf8')
  check('tarball host inject webServer', hostIndex.includes("inject = ['webServer']"))
  check('tarball host 注册 asset route', hostIndex.includes('registerAssetRoute'))
  check('tarball route 引用 manifest', routeSrc.includes('./manifest.js'))
  check('tarball manifest 声明 asset 前缀', manifestSrc.includes('PLUGIN_ASSET_ROUTE_PREFIX'))

  const probe = join(work, 'probe.mjs')
  const indexUrl = pathToFileURL(join(ROOT, 'lib/index.js')).href
  const probeCode = `import { Config, name, inject, apply } from '${indexUrl}';\nif (name !== '@dsh-external/dsh-taffy-theme') throw new Error('bad name');\nif (!Array.isArray(inject) || !inject.includes('webServer')) throw new Error('missing webServer inject');\nif (typeof apply !== 'function') throw new Error('apply missing');\nif (!Config?.['~standard']?.validate) throw new Error('Config schema missing');\nconst result = Config['~standard'].validate({});\nif (result.issues) throw new Error(JSON.stringify(result.issues));\nconsole.log('host-import-ok');\n`
  writeFileSync(probe, probeCode)
  check('dev tree 含 schemastery', existsSync(join(ROOT, 'node_modules/schemastery')))
  const out = execSync(`node "${probe}"`, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  check('dev tree host index 可独立 import', out.includes('host-import-ok'))
} finally {
  rmSync(work, { recursive: true, force: true })
}

console.log(`\n${checks} 项检查，${failures} 项失败`)
if (failures > 0) process.exit(1)
