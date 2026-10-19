#!/usr/bin/env node
/**
 * Peer-range gate.
 *
 * The v0.1.9 range `>=0.1.0-rc.1 <0.2.0-0` looked plausible but satisfied no
 * 0.1.x prerelease at all (semver only admits a prerelease when some comparator
 * carries the same [major,minor,patch] tuple), so the theme declared support
 * for versions it could never install on. This gate pins the contract:
 *
 *   1. every host version we claim to support must satisfy the declared range;
 *   2. the range must stay bounded (< 0.3.0) so drift cannot be papered over
 *      by widening to `*`;
 *   3. a couple of packages legitimately live on only one host line, so their
 *      expected line is declared explicitly rather than inferred.
 *
 * Reads package.json only, so it runs in CI without a host tree.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

/** Host versions whose behaviour this repository was actually verified against. */
const SUPPORTED_HOSTS = ['0.1.6-alpha.1', '0.2.1-rc.2']

/** Packages that exist on only one host line, with the line they belong to. */
const ONLY_ON = {
  // Renamed to the singular `dsh-agent-preset` in 0.2.x; the plural stops at 0.1.5-rc.3.
  '@deepseek-ai/dsh-agent-presets': ['0.1.6-alpha.1'],
  // Re-introduced under the 0.2.x line; absent from the 0.1.6-alpha.1 runtime.
  '@deepseek-ai/dsh-client-ui-slots': ['0.2.1-rc.2'],
}

/** Upper bound every DSH package range must keep. */
const OUT_OF_RANGE = '0.3.0'

/** cordis is versioned independently of the DSH host; the 0.2.x line needs ~4.0.5. */
const CORDIS_REQUIRED_BY = '4.0.5'

const peers = pkg.peerDependencies ?? {}
const meta = pkg.peerDependenciesMeta ?? {}
let failures = 0

function check(label, ok, detail) {
  if (!ok) failures += 1
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
}

console.log('peer 门控：声明范围 vs 已验证宿主版本\n')

for (const [name, range] of Object.entries(peers)) {
  const optional = meta[name]?.optional === true
  const suffix = optional ? ' (optional)' : ''

  // `react` is supplied by the host's module seed and `cordis` is versioned on
  // its own line, so neither is compared against a DSH host version.
  if (name === 'react') continue
  if (name === '@deepseek-ai/cordis') {
    check(`cordis 接受 ${CORDIS_REQUIRED_BY}`, semver.satisfies(CORDIS_REQUIRED_BY, range), range)
    check(`cordis 不越界 (5.0.0)`, !semver.satisfies('5.0.0', range), range)
    continue
  }

  const targets = ONLY_ON[name] ?? SUPPORTED_HOSTS

  for (const version of targets) {
    let ok = false
    try {
      ok = semver.satisfies(version, range)
    } catch {
      ok = false
    }
    check(`${name}${suffix} 接受 ${version}`, ok, range)
  }

  // An optional peer on a line where the package does not exist is fine, but a
  // required peer must not silently vanish from one of the supported lines.
  if (!optional && !ONLY_ON[name]) {
    const missed = SUPPORTED_HOSTS.filter((v) => {
      try {
        return !semver.satisfies(v, range)
      } catch {
        return true
      }
    })
    check(`${name} 覆盖全部支持版本`, missed.length === 0, missed.join(', '))
  }

  let bounded = false
  try {
    bounded = !semver.satisfies(OUT_OF_RANGE, range)
  } catch {
    bounded = false
  }
  check(`${name} 不越界 (${OUT_OF_RANGE})`, bounded, range)
}

// `*`, `>=0` and similar make the gate meaningless: they hide API breaks.
for (const [name, range] of Object.entries(peers)) {
  if (name === 'react') continue
  const widened = range === '*' || range === 'latest' || /^>=?\s*0(\.0\.0)?$/.test(range.trim())
  check(`${name} 未放宽到无约束范围`, !widened, range)
}

console.log(`\n${failures === 0 ? '全部通过' : `${failures} 项失败`}`)

// Optional: when a DSH host tree is present, report what it actually provides.
const hostTree = process.env.DSH_TREE
if (hostTree && existsSync(hostTree)) {
  console.log(`\n宿主树探测：${hostTree}`)
  for (const name of Object.keys(peers)) {
    if (name === 'react' || !name.startsWith('@deepseek-ai/')) continue
    const dir = join(hostTree, name.split('/')[1])
    const manifest = join(dir, 'package.json')
    if (!existsSync(manifest)) {
      const note = meta[name]?.optional ? 'optional, 缺失可接受' : 'MISSING'
      console.log(`  - ${name}: ${note}`)
      continue
    }
    const version = JSON.parse(readFileSync(manifest, 'utf8')).version
    const ok = semver.satisfies(version, peers[name])
    console.log(`  ${ok ? '✓' : '✗'} ${name}@${version}`)
    if (!ok && meta[name]?.optional !== true) failures += 1
  }
} else {
  console.log('\n（未设置 DSH_TREE，跳过宿主树探测）')
}

process.exit(failures === 0 ? 0 : 1)
