// @ts-nocheck
import { createElement, useEffect, useRef, useState } from 'react'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { TaffySettings } from '../state/types'
import { loadSettings, saveSettings } from './settings-store'
import { DEFAULT_HERO_HEADLINE } from './hero-copy'

const SETTINGS_NS = 'settings.taffyTheme'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'settings.general.item': { kind: 'list'; scope: 'root' }
  }
}

function CloverIcon() {
  return createElement('svg', {
    className: 'dsh-taffy-clover',
    viewBox: '0 0 16 16',
    width: 16,
    height: 16,
    'aria-hidden': 'true',
  },
    createElement('path', {
      fill: 'currentColor',
      d: 'M8 1.6c1.4 1.6 1.6 3.4 1.2 4.6 1.2-.6 2.8-.4 4 0.8 1 1 1 2.6 0 3.6-1 1-2.5 1.1-3.6.4 0.3 1.2 0 2.9-1.6 4.4-1.6-1.5-1.9-3.2-1.6-4.4-1.1.7-2.6.6-3.6-.4-1-1-1-2.6 0-3.6 1.2-1.2 2.8-1.4 4-.8C6.4 5 6.6 3.2 8 1.6z',
    }),
  )
}

function Cube({
  selected,
  label,
  onClick,
}: {
  selected: boolean
  label: string
  onClick: () => void
}) {
  return createElement('button', {
    type: 'button',
    className: `dsh-taffy-general-cube${selected ? ' is-selected' : ''}`,
    'aria-pressed': selected,
    onClick,
  }, selected ? CloverIcon() : null, label)
}

function Choice({
  label,
  value,
  options,
  onSelect,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onSelect: (next: string) => void
}) {
  return createElement('div', { className: 'dsh-taffy-slider-row' },
    createElement('div', { className: 'dsh-taffy-slider-head' },
      createElement('span', null, label),
    ),
    createElement('div', { className: 'dsh-taffy-general-cubes' },
      ...options.map((option) => createElement(Cube, {
        key: option.value,
        selected: value === option.value,
        label: option.label,
        onClick: () => onSelect(option.value),
      })),
    ),
  )
}

/**
 * Labels are Chinese here and the ids are the stable ones written into
 * settings, so a label can be reworded without migrating stored preferences.
 * `default` follows the mode; the shipped art is Astral Night material, so the
 * light scheme keeps the wallpaper drawn for Pearl Bloom.
 */
const BACKGROUND_OPTIONS = [
  { value: 'default', label: '跟随主题' },
  { value: 'observatory', label: '观星台' },
  { value: 'balcony', label: '星空露台' },
  { value: 'studio', label: '星夜创作室' },
  { value: 'atelier', label: '午夜工房' },
  { value: 'piano', label: '星夜钢琴室' },
]

const SIDEBAR_OPTIONS = [
  { value: 'default', label: '跟随主题' },
  { value: 'celestial-sidebar', label: '星空侧栏' },
  { value: 'celestial-plum', label: '梅色梦境' },
  { value: 'none', label: '不显示' },
]

const CHIBI_OPTIONS = [
  { value: 'default', label: '跟随主题' },
  { value: 'cat-hug', label: '抱猫猫' },
  { value: 'open-arms', label: '张开手' },
  { value: 'classic', label: '经典头像' },
]

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return createElement('label', { className: 'dsh-taffy-slider-row' },
    createElement('span', { className: 'dsh-taffy-slider-head' },
      createElement('span', null, label),
      createElement('output', null, `${value}%`),
    ),
    createElement('input', {
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      value,
      onInput: (event) => onChange(Number(event.currentTarget.value)),
      onChange: (event) => onChange(Number(event.currentTarget.value)),
    }),
  )
}


function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return createElement('label', { className: 'dsh-taffy-text-row' },
    createElement('span', { className: 'dsh-taffy-slider-head' },
      createElement('span', null, label),
    ),
    createElement('input', {
      type: 'text',
      value,
      placeholder,
      onInput: (event) => onChange(event.currentTarget.value),
    }),
  )
}

function TaffyModeRow() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    const refresh = () => setSettings(loadSettings())
    window.addEventListener('storage', refresh)
    window.addEventListener('dsh-taffy-theme:settings-change', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('dsh-taffy-theme:settings-change', refresh)
    }
  }, [])

  const commitNow = (patch: Partial<TaffySettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    saveSettings({ ...loadSettings(), ...patch })
  }

  const commitRef = useRef(commitNow)
  commitRef.current = commitNow

  const textTimer = useRef(0)
  useEffect(() => () => window.clearTimeout(textTimer.current), [])

  const commitText = (patch: Partial<TaffySettings>) => {
    window.clearTimeout(textTimer.current)
    textTimer.current = window.setTimeout(() => commitRef.current(patch), 300)
  }

  const commit = (patch: Partial<TaffySettings>) => {
    if ('heroHeadline' in patch || 'avatar' in patch) return commitText(patch)
    commitNow(patch)
  }

  return createElement('div', {
    className: 'dsh-taffy-general-row',
    'data-dsh-taffy-settings': '',
  },
    createElement('div', { className: 'dsh-taffy-general-title' }, '塔菲工房'),
    createElement('div', { className: 'dsh-taffy-general-cubes' },
      createElement(Cube, { selected: settings.enabled, label: '开启', onClick: () => commit({ enabled: true }) }),
      createElement(Cube, { selected: !settings.enabled, label: '关闭', onClick: () => commit({ enabled: false }) }),
    ),
    createElement(Slider, {
      label: '边框透明度',
      value: settings.frameOpacity,
      onChange: (frameOpacity) => commit({ frameOpacity }),
    }),
    createElement(Slider, {
      label: '面板透明度',
      value: settings.panelOpacity,
      onChange: (panelOpacity) => commit({ panelOpacity }),
    }),
    createElement(Slider, {
      label: '背景纱',
      value: settings.veilOpacity,
      onChange: (veilOpacity) => commit({ veilOpacity }),
    }),
    createElement(Slider, {
      label: '亚克力透明度',
      value: settings.acrylicPercent,
      onChange: (acrylicPercent) => commit({ acrylicPercent }),
    }),
    createElement('div', { className: 'dsh-taffy-general-title' }, '侧栏装饰'),
    createElement('div', { className: 'dsh-taffy-general-cubes' },
      createElement(Cube, { selected: settings.showMascot, label: '加油喵', onClick: () => commit({ showMascot: !settings.showMascot }) }),
    ),
    createElement(Slider, {
      label: '立绘透明度',
      value: settings.characterOpacity,
      onChange: (characterOpacity) => commit({ characterOpacity }),
    }),
    createElement('div', { className: 'dsh-taffy-general-title' }, '背景与素材'),
    createElement(Choice, {
      label: '首页背景',
      value: settings.backgroundHero,
      options: BACKGROUND_OPTIONS,
      onSelect: (backgroundHero) => commit({ backgroundHero }),
    }),
    createElement(Choice, {
      label: '功能页背景',
      value: settings.backgroundFunctional,
      options: BACKGROUND_OPTIONS,
      onSelect: (backgroundFunctional) => commit({ backgroundFunctional }),
    }),
    createElement(Choice, {
      label: '侧栏水印',
      value: settings.sidebarWatermark,
      options: SIDEBAR_OPTIONS,
      onSelect: (sidebarWatermark) => commit({ sidebarWatermark }),
    }),
    createElement(Choice, {
      label: '底部 Q 版',
      value: settings.chibiMascot,
      options: CHIBI_OPTIONS,
      onSelect: (chibiMascot) => commit({ chibiMascot }),
    }),
    createElement('div', { className: 'dsh-taffy-general-note' },
      '新素材是星夜配色，选「跟随主题」时在深色外观下生效；浅色花房仍用原来的壁纸。侧栏水印与 Q 版两种外观都生效。',
    ),
    createElement('div', { className: 'dsh-taffy-general-title' }, '个性化'),
    createElement(TextField, {
      label: '标题文案',
      value: settings.heroHeadline,
      placeholder: DEFAULT_HERO_HEADLINE,
      onChange: (heroHeadline) => commit({ heroHeadline: heroHeadline.trim() || DEFAULT_HERO_HEADLINE }),
    }),
    createElement(TextField, {
      label: '头像图片地址',
      value: settings.avatar === 'default' ? '' : settings.avatar,
      placeholder: '留空使用默认塔菲头像',
      onChange: (avatar) => commit({ avatar: avatar.trim() || 'default' }),
    }),
    createElement('div', { className: 'dsh-taffy-general-title' }, '减弱动效'),
    createElement('div', { className: 'dsh-taffy-general-cubes' },
      createElement(Cube, { selected: settings.reducedMotion, label: '开启', onClick: () => commit({ reducedMotion: true, motion: 'off' }) }),
      createElement(Cube, { selected: !settings.reducedMotion, label: '关闭', onClick: () => commit({ reducedMotion: false, motion: 'standard' }) }),
    ),
    createElement('div', { className: 'dsh-taffy-general-note' },
      '工房开了喵：浅色花房、深色舞台跟着「外观」走。边框包住对话，百分比只改透明层，人物默认不透明。想听塔菲说话，去 Agent 预设里选「Taffy 塔菲」喵。',
    ),
  )
}

export function registerSettingsPanel(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
    zh: { 'settings.taffyTheme.label': '塔菲工房' },
    en: { 'settings.taffyTheme.label': 'Taffy atelier' },
  }), '@dsh-external/dsh-taffy-theme: locale')

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'taffy-theme',
    order: 11,
    locale: SETTINGS_NS,
  }, TaffyModeRow))
}

