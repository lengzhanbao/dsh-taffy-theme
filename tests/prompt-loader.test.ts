import { describe, expect, it } from 'vitest'
import { loadTaffySystemPrompt } from '../src/prompt/loader.ts'

describe('prompt loader', () => {
  it('loads taffy system prompt markdown', () => {
    const text = loadTaffySystemPrompt()
    expect(text).toContain('永雏塔菲')
    expect(text).toContain('关注永雏塔菲')
    expect(text).toContain('加油喵')
    expect(text).toContain('雏草姬')
    expect(text).toContain('{{model}}')
    expect(text).toContain('萌娘百科')
    expect(text).toContain('不要带入 QQBot')
    expect(text).toContain('先答准')
    expect(text).toContain('抽象')
  })
})
