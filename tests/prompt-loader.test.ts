import { describe, expect, it } from 'vitest'
import { loadTaffySystemPrompt } from '../src/prompt/loader.ts'

describe('prompt loader', () => {
  it('loads taffy system prompt markdown', () => {
    const text = loadTaffySystemPrompt()
    expect(text).toContain('永雏塔菲')
    expect(text).toContain('关注永雏塔菲')
    expect(text).toContain('加油喵')
    expect(text).not.toContain('QQBot')
    expect(text).not.toContain('群聊')
  })
})
