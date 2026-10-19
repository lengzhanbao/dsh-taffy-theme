#!/usr/bin/env node
/**
 * Validate the bundled agent preset against DSH's **official** validator.
 *
 * Why this exists: in 0.2.x the preset mechanism was rearchitected. The old
 * `$DSH_HOME/.agent-presets/<id>/{preset.yml,*.cordis.yml}` convention is gone
 * — the 0.2.x registry package contains no reference to either path — and a
 * preset is now a `PresetDefinition { id, name?, description?, order?, plugins }`
 * registered through `@deepseek-ai/dsh-agent-preset`.
 *
 * The good news is that the composition body is unchanged: `plugins` is still a
 * Cordis entry list, i.e. exactly what `agent.cordis.yml` already contains. So
 * this gate reuses the existing content and checks it against the official
 * `entryListProblem`, rather than rewriting the file and hoping.
 *
 * This does NOT prove the preset loads in a live host — registering a preset
 * from a third-party plugin needs a real 0.2.x environment. It proves the
 * composition is structurally valid per the shipped validator, and it pins the
 * mapping from the files on disk to `PresetDefinition`.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_SCHEMA, Type, load } from 'js-yaml'
import { entryListProblem } from '@deepseek-ai/dsh-agent-preset-registry'

const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'))

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PRESET_DIR = join(ROOT, 'presets/taffy')
const PRESET_ID = 'taffy'

/**
 * Cordis extends YAML with a `!!js` tag carrying an unevaluated expression
 * (e.g. `disabled: !!js process.platform === 'win32'`). Plain js-yaml rejects
 * the tag outright, so it is registered here with the same shape the loader
 * uses: `@deepseek-ai/cordis-plugin-loader` treats a JsExpr as
 * `{ __jsExpr: string }` (utils.d.ts) and evaluates it later.
 */
const jsExprType = new Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  construct: (data) => ({ __jsExpr: data }),
})
const PRESET_SCHEMA = DEFAULT_SCHEMA.extend([jsExprType])

let checks = 0
let failures = 0
function check(label, ok, detail) {
  checks += 1
  if (!ok) failures += 1
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
}

console.log('preset 门控：官方 PresetDefinition 校验\n')

const meta = load(readFileSync(join(PRESET_DIR, 'preset.yml'), 'utf8')) ?? {}
const rows = load(readFileSync(join(PRESET_DIR, 'agent.cordis.yml'), 'utf8'), { schema: PRESET_SCHEMA })
const patchPath = join(ROOT, 'presets/taffy.patch.yml')

check('preset.yml 可解析', typeof meta === 'object' && meta !== null)
check('preset.yml 有 name', typeof meta.name === 'string' && meta.name.length > 0, meta.name)
check('preset.yml 有 description', typeof meta.description === 'string', undefined)
check('preset.yml 的 order 是数字', Number.isInteger(meta.order), String(meta.order))

const isArray = Array.isArray(rows)
check('agent.cordis.yml 解析为 entry list（数组）', isArray, isArray ? `${rows.length} 行` : `实际 ${typeof rows}`)

if (isArray) {
  // The authoritative check: the same function the host uses.
  const problem = entryListProblem(rows)
  check('官方 entryListProblem 通过', problem === undefined, problem)

  const named = rows.filter((row) => row && typeof row === 'object' && typeof row.name === 'string')
  check('每行都有 name', named.length === rows.length, `${named.length}/${rows.length}`)

  const definition = {
    id: PRESET_ID,
    name: meta.name,
    description: meta.description,
    order: meta.order,
    plugins: rows,
  }
  check('可组装为 PresetDefinition', typeof definition.id === 'string' && Array.isArray(definition.plugins))
  console.log(`\n  PresetDefinition: id=${definition.id} name=${definition.name} plugins=${definition.plugins.length}`)
}

// The shipped 0.2.x declaration must stay consistent with the source rows:
// presets/taffy.patch.yml is the artefact DSH actually loads.
const patch = load(readFileSync(patchPath, 'utf8'), { schema: PRESET_SCHEMA })
const patchRow = Array.isArray(patch) ? patch[0]?.insert?.[0] : undefined
check('taffy.patch.yml 是顶层 patch 列表', Array.isArray(patch), typeof patch)
check('第 1 项是 - insert 列表', Array.isArray(patch?.[0]?.insert), typeof patch?.[0]?.insert)
check(
  'preset 行声明 @deepseek-ai/dsh-agent-preset',
  patchRow?.name === '@deepseek-ai/dsh-agent-preset',
  patchRow?.name,
)
check('preset id 为 taffy', patchRow?.config?.id === 'taffy', String(patchRow?.config?.id))

const patchPlugins = patchRow?.config?.plugins
const patchProblem = Array.isArray(patchPlugins) ? entryListProblem(patchPlugins) : 'plugins 不是数组'
check('patch 的 plugins 通过官方 entryListProblem', patchProblem === undefined, patchProblem)
check(
  'patch 的 plugins 与 agent.cordis.yml 逐行一致',
  JSON.stringify(patchPlugins) === JSON.stringify(rows),
  `${Array.isArray(patchPlugins) ? patchPlugins.length : '?'} vs ${Array.isArray(rows) ? rows.length : '?'} 行`,
)

const declaredPatches = [].concat(pkg.dsh?.bundle?.patch ?? [])
check(
  'package.json 的 dsh.bundle.patch 收录 presets/taffy.patch.yml',
  declaredPatches.includes('./presets/taffy.patch.yml'),
  declaredPatches.join(', '),
)

console.log(`\n${checks} 项检查，${failures} 项失败`)
if (failures > 0) process.exit(1)
