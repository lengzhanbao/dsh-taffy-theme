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
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REQUIRED = [
  'package/lib/index.js',
  'package/lib/config.js',
  'package/lib/boot-taffy.js',
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

function collectJsFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectJsFiles(full, out)
    } else if (extname(entry) === '.js') {
      out.push(full)
    }
  }
  return out
}

/**
 * Scan every shipped .js for relative imports and confirm each target resolves
 * to a file inside the packed tarball. Catches files/ omissions like the
 * missing lib/boot-taffy.js that broke the v0.1.3 release.
 */
function checkRelativeImports(pkgRoot) {
  const jsFiles = collectJsFiles(join(pkgRoot, 'lib'))
  const missing = []
  for (const file of jsFiles) {
    const src = readFileSync(file, 'utf8')
    const specifiers = new Set()
    for (const match of src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/g)) {
      specifiers.add(match[1])
    }
    for (const match of src.matchAll(/import\s*\(\s*['"]([^'"]+)['"]/g)) {
      specifiers.add(match[1])
    }
    for (const spec of specifiers) {
      if (!spec.startsWith('.')) continue
      const base = resolve(dirname(file), spec)
      const candidates = extname(base)
        ? [base]
        : [base, `${base}.js`, `${base}.json`, join(base, 'index.js')]
      if (!candidates.some((candidate) => existsSync(candidate))) {
        missing.push(`${file} -> ${spec}`)
      }
    }
  }
  return missing
}

let failures = 0
let checks = 0

function check(label, ok, detail = '') {
  checks++
  if (ok) return
  failures++
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

const work = mkdtempSync(join(tmpdir(), 'taffy-pack-'))

try {
  // Clean stale tarballs first so the find() below cannot pick up an old pack.
  for (const name of readdirSync(ROOT)) {
    if (name.endsWith('.tgz')) rmSync(join(ROOT, name), { force: true })
  }
  execSync('npm pack --pack-destination .', { cwd: ROOT, stdio: 'pipe' })
  const packed = readdirSync(ROOT).find((name) => name.endsWith('.tgz'))
  if (!packed) throw new Error('npm pack produced no .tgz')
  // GNU tar treats "E:..." drive paths as remote hosts unless --force-local.
  // Windows bsdtar (System32) rejects that flag — probe once, then extract.
  const toPosix = (p) => p.replace(/\\/g, '/')
  const packedAbs = toPosix(join(ROOT, packed))
  const destAbs = toPosix(work)
  const tarHelp = execSync('tar --help', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const tarCmd = tarHelp.includes('--force-local')
    ? `tar --force-local -xf "${packedAbs}" -C "${destAbs}"`
    : `tar -xf "${packedAbs}" -C "${destAbs}"`
  execSync(tarCmd, { stdio: 'pipe' })
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

  const missingImports = checkRelativeImports(pkgRoot)
  check(
    'tarball 内所有 .js 相对 import 目标存在',
    missingImports.length === 0,
    missingImports.join('; '),
  )

  const probe = join(work, 'probe.mjs')
  const tarballIndexUrl = pathToFileURL(join(pkgRoot, 'lib/index.js')).href
  const tarballPrompt = `import { Config, name, inject, apply } from '${tarballIndexUrl}';\nimport { injectBootTaffy } from '${pathToFileURL(join(pkgRoot, 'lib/boot-taffy.js')).href}';\nif (name !== '@dsh-external/dsh-taffy-theme') throw new Error('bad name');\nif (!Array.isArray(inject) || !inject.includes('webServer')) throw new Error('missing webServer inject');\nif (typeof apply !== 'function') throw new Error('apply missing');\nif (typeof injectBootTaffy !== 'function') throw new Error('boot-taffy missing from tarball');\nif (typeof injectBootTaffy('<html><body></body></html>') !== 'string') throw new Error('boot-taffy broken');\nif (!Config?.['~standard']?.validate) throw new Error('Config schema missing');\nconst result = Config['~standard'].validate({});\nif (result.issues) throw new Error(JSON.stringify(result.issues));\nconsole.log('tarball-host-import-ok');\n`
  writeFileSync(probe, tarballPrompt)
  check('dev tree 含 schemastery', existsSync(join(ROOT, 'node_modules/schemastery')))
  // Simulate installed deps so the tarball import resolves bare specifiers
  // (e.g. schemastery) exactly like a real host install would.
  // 'junction' works on Windows; on POSIX Node maps it to a dir symlink.
  const linkedModules = join(pkgRoot, 'node_modules')
  if (!existsSync(linkedModules)) {
    symlinkSync(join(ROOT, 'node_modules'), linkedModules, process.platform === 'win32' ? 'junction' : 'dir')
  }
  let tarballImportOk = false
  let tarballImportDetail = ''
  try {
    const tarballOut = execSync(`node "${probe}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    tarballImportOk = tarballOut.includes('tarball-host-import-ok')
  } catch (error) {
    tarballImportDetail = String(error?.stderr ?? error?.message ?? error).split('\n').slice(0, 3).join(' ')
  }
  check('tarball 内 host index 可独立 import', tarballImportOk, tarballImportDetail)
} finally {
  rmSync(work, { recursive: true, force: true })
}

console.log(`\n${checks} 项检查，${failures} 项失败`)
if (failures > 0) process.exit(1)
