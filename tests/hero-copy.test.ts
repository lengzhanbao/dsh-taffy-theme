import { describe, expect, it } from 'vitest'
import { createHeroCopySync, touchesHeroCopy } from '../src/client/hero-copy.ts'

/** 新版空态结构：[data-phase='hero'] 下标题组裸 span（无 headlineText 类名）。 */
function mountHero(headlineText: string): { scope: HTMLElement, headline: HTMLElement } {
  const scope = document.createElement('div')
  scope.setAttribute('data-phase', 'hero')
  const group = document.createElement('span')
  const headline = document.createElement('span')
  headline.textContent = headlineText
  const badge = document.createElement('span')
  badge.textContent = '预览版'
  group.append(headline, badge)
  scope.append(group)
  document.body.append(scope)
  return { scope, headline }
}

describe('hero copy sync', () => {
  it('replaces the host hero headline and restores the exact original text', () => {
    const { scope, headline } = mountHero('探索未至之境')

    const heroCopy = createHeroCopySync()
    heroCopy.apply(document.body)
    expect(headline.textContent).toBe('关注塔菲喵！关注塔菲谢谢喵！')

    heroCopy.restore()
    expect(headline.textContent).toBe('探索未至之境')
    scope.remove()
  })

  it('replaces the English host headline but leaves custom text alone', () => {
    const en = mountHero('Into the Unknown')
    const custom = mountHero('用户自己的标题')

    const heroCopy = createHeroCopySync()
    heroCopy.apply(document.body)
    expect(en.headline.textContent).toBe('关注塔菲喵！关注塔菲谢谢喵！')
    expect(custom.headline.textContent).toBe('用户自己的标题')

    heroCopy.restore()
    expect(en.headline.textContent).toBe('Into the Unknown')
    en.scope.remove()
    custom.scope.remove()
  })

  it('applies a settings-driven headline and still restores the original', () => {
    const { scope, headline } = mountHero('探索未至之境')

    let custom = '自定义标题喵'
    const heroCopy = createHeroCopySync(() => custom)
    heroCopy.apply(document.body)
    expect(headline.textContent).toBe('自定义标题喵')

    custom = '换一句喵'
    heroCopy.apply(document.body)
    expect(headline.textContent).toBe('换一句喵')

    heroCopy.restore()
    expect(headline.textContent).toBe('探索未至之境')
    scope.remove()
  })

  it('detects either a hero scope or a wrapper containing one', () => {
    const { scope } = mountHero('探索未至之境')
    const wrapper = document.createElement('div')
    wrapper.append(scope)

    expect(touchesHeroCopy(scope)).toBe(true)
    expect(touchesHeroCopy(wrapper)).toBe(true)
    expect(touchesHeroCopy(document.createElement('div'))).toBe(false)
    scope.remove()
  })
})
