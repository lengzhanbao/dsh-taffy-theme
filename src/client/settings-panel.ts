// @ts-nocheck
import { createElement, useEffect, useRef, useState } from 'react'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { TaffySettings } from '../state/types'
import { loadSettings, saveSettings } from './settings-store'
import { DEFAULT_HERO_HEADLINE } from './hero-copy'
import {
  BUNDLED_AVATAR,
  BUNDLED_BACKGROUNDS,
  BUNDLED_CHIBI,
  BUNDLED_SIDEBAR_WATERMARKS,
  BUNDLED_WALLPAPER_DARK,
  BUNDLED_WALLPAPER_LIGHT,
} from './bundled-assets'
import { isNightScene } from '../assets/resolve'

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
  // Compact segmented buttons: the generic Cube is intentionally large and
  // caused the third item to wrap into a full-width card in DSH Desktop.
  return createElement('div', { className: 'dsh-taffy-slider-row dsh-taffy-choice-row' },
    createElement('div', { className: 'dsh-taffy-slider-head' },
      createElement('span', null, label),
    ),
    createElement('div', { className: 'dsh-taffy-choice-group', role: 'group', 'aria-label': label },
      ...options.map((option) => createElement('button', {
        key: option.value,
        type: 'button',
        className: `dsh-taffy-choice${value === option.value ? ' is-selected' : ''}`,
        'aria-pressed': value === option.value,
        onClick: () => onSelect(option.value),
      }, option.label)),
    ),
  )
}

/**
 * The ids are the stable values written into settings, so a label can be
 * reworded without migrating stored preferences.
 *
 * Every art option carries a thumbnail: "观星台" and "星夜钢琴室" are
 * indistinguishable as words, which is exactly why the picker shows the picture.
 * The label survives as aria-label and title only.
 */
const backgroundOptions = () => {
  const classic = isNightScene() ? BUNDLED_WALLPAPER_DARK : BUNDLED_WALLPAPER_LIGHT
  return [
    { value: 'default', label: '跟随外观（当前经典壁纸）', src: classic },
    { value: 'classic-light', label: '经典花房', src: BUNDLED_WALLPAPER_LIGHT },
    { value: 'classic-dark', label: '经典舞台', src: BUNDLED_WALLPAPER_DARK },
    { value: 'observatory', label: '观星台', src: BUNDLED_BACKGROUNDS.observatory },
    { value: 'balcony', label: '星空露台', src: BUNDLED_BACKGROUNDS.balcony },
    { value: 'studio', label: '星夜创作室', src: BUNDLED_BACKGROUNDS.studio },
    { value: 'atelier', label: '午夜工房', src: BUNDLED_BACKGROUNDS.atelier },
    { value: 'piano', label: '星夜钢琴室', src: BUNDLED_BACKGROUNDS.piano },
  ]
}

const sidebarOptions = () => [
  { value: 'default', label: '不显示', src: '' },
  { value: 'celestial-sidebar', label: '星空侧栏', src: BUNDLED_SIDEBAR_WATERMARKS['celestial-sidebar'] },
  { value: 'celestial-plum', label: '梅色梦境', src: BUNDLED_SIDEBAR_WATERMARKS['celestial-plum'] },
]

const chibiOptions = () => [
  { value: 'default', label: '经典头像', src: BUNDLED_AVATAR },
  { value: 'cat-hug', label: '抱猫猫', src: BUNDLED_CHIBI['cat-hug'] },
  { value: 'open-arms', label: '张开手', src: BUNDLED_CHIBI['open-arms'] },
]

const DECORATION_OPTIONS = [
  { value: 'off', label: '关闭' },
  { value: 'simple', label: '简约' },
  { value: 'full', label: '完整' },
]

/**
 * Picture picker. Renders the actual asset so the choice is recognisable at a
 * glance; the label is kept for screen readers and as a hover tooltip, never as
 * the primary affordance. `variant` matches the asset's aspect ratio so a 9:16
 * watermark is not squashed into a 16:9 box.
 */
function SwatchRow({
  label,
  value,
  options,
  variant = 'wide',
  onSelect,
}: {
  label: string
  value: string
  options: { value: string; label: string; src: string }[]
  variant?: 'wide' | 'tall' | 'square'
  onSelect: (next: string) => void
}) {
  return createElement('div', { className: 'dsh-taffy-slider-row' },
    createElement('div', { className: 'dsh-taffy-slider-head' },
      createElement('span', null, label),
    ),
    createElement('div', { className: 'dsh-taffy-swatches' },
      ...options.map((option) => createElement('button', {
        key: option.value,
        type: 'button',
        className: `dsh-taffy-swatch dsh-taffy-swatch--${variant}${value === option.value ? ' is-selected' : ''}`,
        'aria-pressed': value === option.value,
        'aria-label': option.label,
        title: option.label,
        onClick: () => onSelect(option.value),
      },
        option.src
          ? createElement('img', { src: option.src, alt: '', loading: 'lazy', decoding: 'async', draggable: false })
          : createElement('span', { className: 'dsh-taffy-swatch-empty', 'aria-hidden': 'true' }),
      )),
    ),
  )
}

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
    createElement(SwatchRow, {
      label: '首页背景',
      value: settings.backgroundHero,
      options: backgroundOptions(),
      onSelect: (backgroundHero) => commit({ backgroundHero }),
    }),
    createElement(SwatchRow, {
      label: '功能页背景',
      value: settings.backgroundFunctional,
      options: backgroundOptions(),
      onSelect: (backgroundFunctional) => commit({ backgroundFunctional }),
    }),
    createElement(Choice, {
      label: '侧栏装饰',
      value: settings.sidebarDecoration,
      options: DECORATION_OPTIONS,
      onSelect: (sidebarDecoration) => commit({ sidebarDecoration }),
    }),
    createElement(SwatchRow, {
      label: '侧栏水印',
      value: settings.sidebarWatermark,
      options: sidebarOptions(),
      variant: 'tall',
      onSelect: (sidebarWatermark) => commit({ sidebarWatermark }),
    }),
    createElement(SwatchRow, {
      label: '底部 Q 版',
      value: settings.chibiMascot,
      options: chibiOptions(),
      variant: 'square',
      onSelect: (chibiMascot) => commit({ chibiMascot }),
    }),
    createElement('div', { className: 'dsh-taffy-general-note' },
      '「跟随外观」沿用你原来的壁纸；经典花房 / 经典舞台是升级前的两张图，随时可选。星夜素材只在深色外观下观感统一。装饰等级选「完整」才会改动侧栏按钮的尺寸与图标。',
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

