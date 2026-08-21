import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { resolveAssetPath, servePluginAsset } from '../src/assets/route.ts'
import { PLUGIN_ASSET_ROUTE_PREFIX } from '../src/assets/manifest.ts'

describe('plugin asset route', () => {
  it('rejects path traversal', () => {
    const root = mkdtempSync(join(tmpdir(), 'taffy-assets-'))
    expect(() => resolveAssetPath('../secret.txt', root)).toThrow(/escapes plugin root/)
  })

  it('serves files under the plugin assets prefix', async () => {
    const root = mkdtempSync(join(tmpdir(), 'taffy-assets-'))
    const taffyDir = join(root, 'taffy')
    mkdirSync(taffyDir, { recursive: true })
    writeFileSync(join(taffyDir, 'avatar.webp'), 'webp-bytes')

    const status = { code: 0, headers: {} as Record<string, string | string[] | undefined>, body: '' }
    const res = {
      writeHead(code: number, headers?: Record<string, string>) {
        status.code = code
        status.headers = headers ?? {}
      },
      end(body?: string) {
        status.body = body ?? ''
      },
    }

    await servePluginAsset(
      { method: 'GET', headers: { host: '127.0.0.1:3080' }, url: `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy/avatar.webp` },
      res as never,
      `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy/avatar.webp`,
      root,
    )

    expect(status.code).toBe(200)
    expect(status.headers['content-type']).toBe('image/webp')
    expect(status.body.toString()).toBe('webp-bytes')
  })

  it('rejects non-loopback requests', async () => {
    const root = mkdtempSync(join(tmpdir(), 'taffy-assets-'))
    const status = { code: 0 }
    const res = {
      writeHead(code: number) {
        status.code = code
      },
      end() {},
    }

    await servePluginAsset(
      { method: 'GET', headers: { host: '203.0.113.10:3080' }, url: `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy/x.webp` },
      res as never,
      `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy/x.webp`,
      root,
    )

    expect(status.code).toBe(403)
  })
})
