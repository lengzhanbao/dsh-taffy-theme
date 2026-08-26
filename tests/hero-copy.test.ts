import { describe, expect, it } from 'vitest'
import { createHeroCopySync, touchesHeroCopy } from '../src/client/hero-copy.ts'

describe('hero copy sync', () => {
  it('replaces the host hero headline and restores the exact original text', () => {
    const headline = document.createElement('span')
    headline.className = 'hero_headlineText'
    headline.textContent = '探索未至之境'
    document.body.append(headline)

    const heroCopy = createHeroCopySync()
    heroCopy.apply(document.body)
    expect(headline.textContent).toBe('关注塔菲喵！关注塔菲谢谢喵！')

    heroCopy.restore()
    expect(headline.textContent).toBe('探索未至之境')
    headline.remove()
  })

  it('applies a settings-driven headline and still restores the original', () => {
    const headline = document.createElement('span')
    headline.className = 'hero_headlineText'
    headline.textContent = '探索未至之境'
    document.body.append(headline)

    let custom = '自定义标题喵'
    const heroCopy = createHeroCopySync(() => custom)
    heroCopy.apply(document.body)
    expect(headline.textContent).toBe('自定义标题喵')

    custom = '换一句喵'
    heroCopy.apply(document.body)
    expect(headline.textContent).toBe('换一句喵')

    heroCopy.restore()
    expect(headline.textContent).toBe('探索未至之境')
    headline.remove()
  })

  it('detects either a mounted headline or a wrapper containing one', () => {
    const headline = document.createElement('span')
    headline.className = 'hero_headlineText'
    const wrapper = document.createElement('div')
    wrapper.append(headline)

    expect(touchesHeroCopy(headline)).toBe(true)
    expect(touchesHeroCopy(wrapper)).toBe(true)
    expect(touchesHeroCopy(document.createElement('div'))).toBe(false)
  })
})
