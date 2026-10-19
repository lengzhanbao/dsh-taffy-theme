#!/usr/bin/env node
/**
 * DSH Desktop acceptance probe.
 *
 * Talks to the **running desktop app's own renderer** over the Chrome DevTools
 * Protocol, so the evidence comes from `dsh-app://app` rather than from a
 * browser tab. This is the missing half of `docs/DESKTOP-RUNTIME-EVIDENCE.md`:
 * that document proves the install gate, the asset routes and the shell's
 * forwarding path; this one observes the client bundle actually mounted.
 *
 * Usage (the app must already be running with CDP enabled, see
 * `docs/DESKTOP-ACCEPTANCE-RUNBOOK.md`):
 *
 *   node scripts/desktop-accept.mjs light
 *   node scripts/desktop-accept.mjs dark      # after switching the theme
 *   node scripts/desktop-accept.mjs residual  # after disabling the plugin
 *
 * No dependencies: Node 22+ ships `fetch` and `WebSocket`.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const PORT = process.env.DSH_DESKTOP_CDP_PORT ?? '9333'
const REPORT_PATH = resolve(process.env.DSH_DESKTOP_REPORT ?? '.cache/desktop-accept-report.json')
const LABEL = process.argv[2] ?? 'snapshot'
/**
 * The desktop renderer's origin. Overridable so the same probe can be pointed at
 * an isolated `dsh web` instance while developing the probe itself; the default
 * stays strict so an acceptance run cannot silently measure the wrong page.
 */
const TARGET_PREFIX = process.env.DSH_DESKTOP_TARGET_PREFIX ?? 'dsh-app://app'

const PROBE = `(async () => {
  const body = document.body;
  const doc = document;
  const q = (sel) => doc.querySelectorAll(sel).length;
  const imgs = [...doc.querySelectorAll('[data-taffy-character], [data-taffy-mascot="sidebar"]')];
  await Promise.all(imgs.map((img) => Promise.race([
    img.decode().catch(() => undefined),
    new Promise((r) => setTimeout(r, 3000))
  ])));
  const sheet = doc.getElementById('dsh-taffy-theme-style');
  const cs = getComputedStyle(body);
  return {
    origin: location.origin,
    href: location.href,
    themeMarker: body.hasAttribute('data-dsh-taffy-theme'),
    preset: body.getAttribute('data-taffy-preset'),
    state: body.getAttribute('data-taffy-state'),
    dark: body.hasAttribute('data-ds-dark-theme'),
    styleNode: sheet !== null,
    styleBytes: sheet === null ? 0 : (sheet.textContent || '').length,
    skinOwned: q('[data-skin-owner="dsh-taffy-theme"]'),
    skinChrome: q('[data-skin-chrome]'),
    characters: q('[data-taffy-character]'),
    mascots: q('[data-taffy-mascot="sidebar"]'),
    sparkles: q('[data-taffy-sparkles]'),
    veil: q('[data-taffy-veil]'),
    ground: q('[data-taffy-ground]'),
    assetErrors: q('[data-taffy-asset-error]'),
    cream: cs.getPropertyValue('--ds-taffy-cream').trim(),
    pink: cs.getPropertyValue('--ds-taffy-pink').trim(),
    text: cs.getPropertyValue('--ds-taffy-text').trim(),
    images: imgs.map((img) => ({
      tag: img.tagName,
      slot: img.getAttribute('data-taffy-character') || img.getAttribute('data-taffy-mascot'),
      src: img.currentSrc || img.getAttribute('src'),
      w: img.naturalWidth,
      h: img.naturalHeight
    })),
    generalRows: q('.dsh-taffy-general-row'),
    settingsHost: q('[data-dsh-taffy-settings]'),
    composer: q('[data-composer-card]') > 0,
    sidebarSettings: q('[data-slot="sidebar.settings"]') > 0,
    taffyStorage: Object.keys(localStorage).filter((k) => /taffy/i.test(k)),
    unattributedStyleNodes: [...doc.querySelectorAll('style[id]')]
      .map((n) => n.id)
      .filter((id) => /taffy/i.test(id) && id !== 'dsh-taffy-theme-style')
  };
})()`

function openCdp(wsUrl) {
  return new Promise((okay, fail) => {
    const ws = new WebSocket(wsUrl)
    const pending = new Map()
    let seq = 0
    const timer = setTimeout(() => fail(new Error(`CDP connect timed out: ${wsUrl}`)), 10_000)
    ws.addEventListener('open', () => {
      clearTimeout(timer)
      okay({
        send(method, params = {}) {
          const id = ++seq
          return new Promise((res, rej) => {
            pending.set(id, { res, rej })
            ws.send(JSON.stringify({ id, method, params }))
          })
        },
        close() {
          ws.close()
        }
      })
    })
    ws.addEventListener('error', () => {
      clearTimeout(timer)
      fail(new Error(`CDP websocket error: ${wsUrl}`))
    })
    ws.addEventListener('message', (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      const slot = msg.id === undefined ? undefined : pending.get(msg.id)
      if (slot === undefined) return
      pending.delete(msg.id)
      if (msg.error) slot.rej(new Error(msg.error.message ?? 'CDP error'))
      else slot.res(msg.result)
    })
  })
}

async function findAppTarget() {
  let list
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
    list = await res.json()
  } catch (error) {
    throw new Error(
      `Cannot reach the DevTools endpoint on 127.0.0.1:${PORT} (${error.message}).\n` +
        `Start DSH Desktop with --remote-debugging-port=${PORT} and try again.`
    )
  }
  const targets = list.filter((t) => t.type === 'page')
  const app = targets.find((t) => typeof t.url === 'string' && t.url.startsWith(TARGET_PREFIX))
  if (app === undefined) {
    const seen = targets.map((t) => `  ${t.url}`).join('\n') || '  (no page targets)'
    throw new Error(`No ${TARGET_PREFIX} target found. Page targets seen:\n${seen}`)
  }
  return app
}

function line(ok, name, detail) {
  const mark = ok === undefined ? '·' : ok ? '✓' : '✗'
  return `  ${mark} ${name.padEnd(30)} ${detail}`
}

function evaluateSnapshot(snap, label) {
  const residual = label === 'residual'
  const rows = []
  const want = residual
    ? {
        'body 已无 taffy 标记': !snap.themeMarker,
        '样式节点已移除': !snap.styleNode,
        '装饰节点已清空': snap.skinOwned === 0 && snap.characters === 0 && snap.mascots === 0,
        '无残留 taffy 样式节点': snap.unattributedStyleNodes.length === 0
      }
    : {
        'body 带 taffy 标记': snap.themeMarker,
        '样式节点已注入': snap.styleNode && snap.styleBytes > 10_000,
        '装饰节点已挂载': snap.skinOwned >= 5,
        '立绘已挂载': snap.characters >= 1,
        '状态机在跑': ['idle', 'streaming', 'tool-calling'].includes(snap.state ?? ''),
        '素材无加载错误': snap.assetErrors === 0,
        '立绘已解码': snap.images.length > 0 && snap.images.every((i) => i.w > 0 && i.h > 0),
        '主题 token 生效': snap.cream !== ''
      }
  for (const [name, passed] of Object.entries(want)) rows.push({ ok: passed, name })
  const info = [
    ['origin', snap.origin],
    ['preset', snap.preset ?? '(none)'],
    ['state', snap.state ?? '(none)'],
    ['dark', String(snap.dark)],
    ['style bytes', String(snap.styleBytes)],
    ['skin-owned / chrome', `${snap.skinOwned} / ${snap.skinChrome}`],
    ['characters / mascots', `${snap.characters} / ${snap.mascots}`],
    ['sparkles / veil / ground', `${snap.sparkles} / ${snap.veil} / ${snap.ground}`],
    ['asset errors', String(snap.assetErrors)],
    ['--ds-taffy-cream', snap.cream || '(unset)'],
    ['--ds-taffy-pink', snap.pink || '(unset)'],
    ['--ds-taffy-text', snap.text || '(unset)'],
    ['settings general rows', String(snap.generalRows)],
    ['localStorage taffy keys', snap.taffyStorage.join(', ') || '(none)'],
    ['composer / sidebar slot', `${snap.composer} / ${snap.sidebarSettings}`]
  ]
  for (const [name, detail] of info) rows.push({ ok: undefined, name, detail })
  return rows
}

async function loadReport() {
  try {
    return JSON.parse(await readFile(REPORT_PATH, 'utf8'))
  } catch {
    return { snapshots: {} }
  }
}

async function main() {
  const target = await findAppTarget()
  const cdp = await openCdp(target.webSocketDebuggerUrl)
  let snapshot
  try {
    const result = await cdp.send('Runtime.evaluate', {
      expression: PROBE,
      awaitPromise: true,
      returnByValue: true
    })
    if (result.exceptionDetails !== undefined) {
      throw new Error(
        `Probe threw inside the renderer: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`
      )
    }
    snapshot = result.result.value
  } finally {
    cdp.close()
  }

  const previous = await loadReport()
  previous.generatedAt = new Date().toISOString()
  previous.port = PORT
  previous.target = { url: target.url, title: target.title }
  previous.snapshots = { ...previous.snapshots, [LABEL]: snapshot }
  await mkdir(dirname(REPORT_PATH), { recursive: true })
  await writeFile(REPORT_PATH, `${JSON.stringify(previous, null, 2)}\n`, 'utf8')

  console.log(`\nDSH Desktop acceptance — snapshot "${LABEL}"`)
  console.log(`  target: ${target.url}`)
  for (const row of evaluateSnapshot(snapshot, LABEL)) {
    console.log(line(row.ok, row.name, row.detail ?? ''))
  }
  for (const img of snapshot.images) {
    console.log(
      `  · image ${String(img.slot).padEnd(10)} ${img.w}x${img.h}  ${String(img.src).slice(0, 96)}`
    )
  }

  const shots = previous.snapshots
  if (shots.light !== undefined && shots.dark !== undefined) {
    const differs =
      shots.light.dark !== shots.dark.dark ||
      shots.light.preset !== shots.dark.preset ||
      shots.light.cream !== shots.dark.cream
    console.log(
      line(
        differs,
        'light→dark 真的变了',
        `dark=${shots.light.dark}→${shots.dark.dark}, preset=${shots.light.preset}→${shots.dark.preset}`
      )
    )
  }

  console.log(`\n  report: ${REPORT_PATH}`)
  const failed = evaluateSnapshot(snapshot, LABEL).filter((r) => r.ok === false)
  if (failed.length > 0) {
    console.log(`  ${failed.length} 项未通过`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(`\n探针失败：${error.message}\n`)
  process.exitCode = 1
})
