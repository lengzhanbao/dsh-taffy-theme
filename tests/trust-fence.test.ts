import { describe, expect, it } from 'vitest'
import { isLoopbackHostname, isTrustedLocalRequest } from '../src/assets/trust-fence.ts'

describe('asset trust fence', () => {
  it('accepts loopback hostnames', () => {
    expect(isLoopbackHostname('127.0.0.1')).toBe(true)
    expect(isLoopbackHostname('localhost')).toBe(true)
  })

  it('rejects non-loopback hostnames', () => {
    expect(isLoopbackHostname('192.168.1.10')).toBe(false)
    expect(isLoopbackHostname('example.com')).toBe(false)
  })

  it('requires a loopback Host header', () => {
    expect(isTrustedLocalRequest({ host: '127.0.0.1:3080' })).toBe(true)
    expect(isTrustedLocalRequest({ host: '203.0.113.10:3080' })).toBe(false)
    expect(isTrustedLocalRequest({})).toBe(false)
  })
})
