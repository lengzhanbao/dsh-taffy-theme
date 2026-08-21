import type { IncomingHttpHeaders } from 'node:http'

function header(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name]
  return typeof value === 'string' ? value : undefined
}

function parseAuthority(authority: string): URL | undefined {
  try {
    return new URL(`http://${authority}`)
  } catch {
    return undefined
  }
}

export function isLoopbackHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/** Local browser-trust fence for plugin static assets (loopback Host only). */
export function isTrustedLocalRequest(headers: IncomingHttpHeaders): boolean {
  const host = header(headers, 'host')
  if (!host) return false
  const hostUrl = parseAuthority(host)
  if (!hostUrl) return false
  return isLoopbackHostname(hostUrl.hostname)
}
