import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import { PLUGIN_ASSET_ROUTE_PREFIX } from './manifest.js'
import { isTrustedLocalRequest } from './trust-fence.js'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ASSETS_ROOT = join(PACKAGE_ROOT, 'assets')

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

export function resolveAssetPath(relativePath: string, assetsRoot = ASSETS_ROOT): string {
  const target = resolve(normalize(join(assetsRoot, relativePath.replace(/^\/+/, ''))))
  if (target !== assetsRoot && !target.startsWith(assetsRoot + sep)) {
    throw new Error('asset path escapes plugin root')
  }
  return target
}

export async function servePluginAsset(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  assetsRoot = ASSETS_ROOT,
  routePrefix = PLUGIN_ASSET_ROUTE_PREFIX,
): Promise<void> {
  if (!isTrustedLocalRequest(req.headers)) {
    res.writeHead(403)
    res.end()
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end()
    return
  }
  if (!pathname.startsWith(`${routePrefix}/`)) {
    res.writeHead(404)
    res.end()
    return
  }

  let target: string
  try {
    target = resolveAssetPath(pathname.slice(routePrefix.length + 1), assetsRoot)
  } catch {
    res.writeHead(403)
    res.end()
    return
  }

  try {
    const body = await readFile(target)
    res.writeHead(200, {
      'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=0, must-revalidate',
    })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch {
    res.writeHead(404)
    res.end()
  }
}

export function registerAssetRoute(ctx: Context, assetsRoot = ASSETS_ROOT): () => void {
  return ctx.webServer.register({
    kind: 'prefix',
    path: PLUGIN_ASSET_ROUTE_PREFIX,
    handler: async (req, res) => {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://dsh.internal').pathname)
      await servePluginAsset(req, res, pathname, assetsRoot)
    },
  })
}
