# Astral Atelier 改版实现说明

对应规格包：`taffy_theme_redesign_bundle.zip`（specs/00–07 + prompts/）
执行日期：2026-10-19
分支：`compat/dsh-0.2.x`

本文记录**实际做了什么、依据是什么、以及规格里哪些部分无法用代码交付**。

---

## 0. 一句话结论

规格的**工程部分**（配色、密度、底板、层级）已落地并有实测证据；
规格的**P0 素材部分**（设置页背景重画、左栏水印重画）**无法用 CSS 实现**，
必须重画位图 —— 原因见 §1，这是本轮最重要的发现。

---

## 1. 关键架构发现：人物是画在位图里的

改版的第一直觉是「把左栏半身角色压成弱水印」「设置页右侧角色缩小」。
实机测量后发现**这条路走不通**：

| 元素 | 实测尺寸 | display | 结论 |
| --- | --- | --- | --- |
| `[data-taffy-wallpaper]` | **1600×1000** fixed | block | 唯一可见的背景层 |
| `[data-taffy-character='left']` | **0×0** | **none** | 不渲染 |
| `[data-taffy-character='right']` | **0×0** | **none** | 不渲染 |
| `[data-taffy-ground]` | **0×0** | none | 不渲染 |
| `[data-skin-chrome='taffy-top-curtain']` | **0×0** | none | 不渲染 |
| `[data-skin-chrome='taffy-bottom-curtain']` | **0×0** | none | 不渲染 |
| `[data-skin-chrome='atelier-frame']` | **0×0** | none | 不渲染 |

原因是 `src/client/mount.ts:205`：

```ts
body.setAttribute('data-taffy-scene', 'fused')
```

`fused` 是**无条件写死的唯一场景**，而样式表在 fused 场景下隐藏人物层与地面层
（`components.css:262`）。所以：

> **截图中那两张竖立绘、整个巴洛克房间、地板反光，全部烘焙在
> `wallpaper-light.webp` / `wallpaper-dark.webp` 这一张位图里。**

**推论**：CSS 无法把人物从位图里分离出来。规格 specs/03 的 A（设置页背景重画）与
B（左栏水印重画）**只能靠重画素材**，任何选择器层面的改动都做不到。

这也是为什么第一版改动「看不出来」—— 第一批规则打在 `display:none` 的元素上，
是**死代码**。已全部删除，并加了一条回归测试
（`tests/decoration-budget.test.ts`）锁死这个推理。

---

## 2. 配色：Astral Night / Pearl Bloom

specs/04 的色板已落地为 `src/theme/tokens.css` 里的 `--ds-taffy-*` 语义层。

### 2.1 规格原值有三处不达标，已修正并记录

| 模式 | Token | 规格值 | 问题 | 采用值 | 实测 |
| --- | --- | --- | --- | --- | --- |
| Light | `text.muted` | `#9a7f92` | 浅底上 **3.45:1**，不足正文 AA 4.5 | `#7a6574` | 4.56–5.10:1 |
| Light | `accent.pink` | `#dd7da9` | 浅底上 **2.65:1**，不足 UI 3:1 | `#c26e95`（UI） | 3.02–3.37:1 |
| Light | `accent.gold` | `#bf8d50` | 浅底上 **2.81:1** | `#ae8049`（UI） | 3.01–3.36:1 |

修正方式是**保色相压暗**（等比缩放 RGB），不是换色。品牌粉仍保留
`--ds-taffy-pink: #dd7da9` 用于填充，另给 `--ds-taffy-pink-ui` / `--ds-taffy-gold-ui`
供边框、图标、焦点环等「需要 3:1」的用途；文字级另给
`--taffy-pink-ink: #9c2f5c`（6.04–6.75:1）与 `--ds-taffy-gold-deep: #896539`（4.51–5.04:1）。

同一个模式在仓里早有先例（焦点环就是因为 1.94:1 改成 ink 双色），这次沿用该做法。

### 2.2 深色模式

规格值全部达标，原样采用：主文 16.26:1、次级 11.69:1、弱化 6.61:1（对 `#160f1e`）。

### 2.3 新增蓝紫

`accent.blueviolet` 是规格新增的冷调补充色，仓里此前没有：深色 `#8f95ff`、浅色 `#757ce0`。

---

## 3. 把对比度门禁接回出厂配色

改版前的门禁是这样的：`verify/baseline.json` 存一份**十六进制字面量清单**，
`scripts/verify-taffy.mjs` 只复查这些字面量。它**从不读 `tokens.css`** ——
所以配色改了它照样全绿。本次实测时清单里绝大多数值（`#fff7f1`、`#211b32`、`#141018`…）
已经不对应任何出厂 token，属于「永远通过、什么都没验」。

两处修正：

1. `verify/baseline.json` 的 `contrastPairs` / `contrastPairsUi` 由脚本从
   `tokens.css` **重新生成**（文字 30 组 + UI 15 组，全部达标）。
2. 新增 `tests/palette-contrast.test.ts`（37 项）：**直接读 `tokens.css`**，
   取出两种模式实际声明的文字/强调色与三个表面色，逐对测对比度。
   这样 token 一改，测试立刻反映，而不是清单漂移。

---

## 4. 装饰预算：做了什么，实测多少

改动集中在 `components.css` 末尾的「Astral Atelier — decoration budget」段落，
全部通过 knob 变量控制，单条可回滚。

| 项 | 之前 | 之后 | 依据 | 实测 |
| --- | --- | --- | --- | --- |
| 闪烁粒子（动画中） | 0.42–0.68 | 0.18–0.30 | specs/01 §四.2 | ✓ |
| 闪烁粒子（静态） | 0.55 | 0.20 | 同上 | ✓ |
| 粒子点层数 / 密度 | 3 层 | 2 层 + 更大铺贴 | 同上 | ✓ |
| 壁纸整体 | 无处理 | `saturate(.92) brightness(.98)` | specs/01 §一.1 | ✓ |
| **设置页壁纸** | 1 | **0.42**，`saturate(.72) blur(1px)` | specs/01 §四.2 | ✓ |
| 氛围层 | 1 | 0.62（设置页 0.32） | specss/01 §四.2 | ✓ |
| 侧栏底部 Q 版 | 118px | **84px** | specs/05 §三.1 | ✓ |
| 侧栏渐变层 | 1 | 0.6 | specs/02 §一 | ✓ |
| 输入框金饰 `::before` | 1 | 0.58 | specs/01 §四.3 | ✓ |
| 输入框金边 `::after` | 1 | 0.66 | 同上 | ✓ |
| 设置页底板 | 实底 | `--ds-taffy-glass` + `blur(18px)` | specs/02 §二 | ✓ |
| 设置行间距 | 8px / 16px | 10px / 20px | specs/02 §二 | ✓ |
| 设置标题 / 说明 | 继承 | `#4d3045` / `#7a6574` | specs/04 §三 | ✓ |

设置页那一组是在合成 DOM 上验证的（见 §6），因为隔离实例未登录、进不到设置页。

---

## 5. 规格里无法交付的部分（必须重画素材）

| 规格条款 | 为什么代码做不到 |
| --- | --- |
| specs/03 A：设置页背景改成 UI 专用图 | 背景是**一张位图**，人物、灯光、花瓣都在里面。CSS 只能整体压暗/降饱和，无法「中间留空、人物靠右」 |
| specs/03 B：左栏水印图 | 左栏没有独立的人物元素（`[data-taffy-character]` 恒为 `display:none`），半身像来自同一张壁纸。**没有可单独调透明度的对象** |
| specs/01 §四.1「左栏半身角色改成单色水印」 | 同上 |
| specs/03 C/D：首页主视觉、Q 版重画 | 需要画 |

**代码侧能做的近似**：设置页把壁纸压到 0.42 并加 1px 模糊、粒子减半、氛围层降到
0.32 —— 这能让设置内容明显更易读，但**画面本身仍然是那张海报**。
真正的解法是 specs/03 的素材重画，`prompts/` 里已备好提示词。

---

## 6. 验证状态

### 已实测

- `npm run ci` 全绿：peers 15 / preset 57 / static 134 / **162 测试** / pack 56
- 浏览器端（隔离实例 + 真实 Edge，0.2.1-rc.2）10/10：标记、样式节点、15 个装饰节点、
  `--ds-taffy-cream=#fff8fc`（新值）、状态机 idle、无异常
- 壁纸规则生效：`filter=saturate(0.92) brightness(0.98)`
- 设置页态：壁纸 `opacity 1 → 0.42`、`blur(1px)`、氛围层 `0.62 → 0.32`、粒子再减半
- 设置页合成 DOM：底板 `rgba(255,250,253,0.82)`、`blur(18px) saturate(1.04)`、
  行内距 20px、标题 `rgb(77,48,69)`、说明 `rgb(122,101,116)`

### 未验证

- **真实设置页**（需登录，隔离实例进不去）
- **Electron 渲染进程内**（同前，需带 `--remote-debugging-port` 重启桌面版）
- 深浅色切换、持久化、卸载残留

### 一个测量陷阱（记下来免得重犯）

设置页态给了壁纸 `transition: 260ms`。设置属性后**立刻**读 `getComputedStyle`
读到的是过渡起始值（`opacity=1`、`blur(0px)`），会误判成「规则没生效」。
必须等过渡结束再读。本轮因此白查了两轮。

---

## 7. 重装陷阱：同版本号不会替换文件

实测：改完代码重新 `npm pack`（**版本号仍是 0.1.9**）后执行 `plugin add`，
pnpm 复用了先前的解析结果，`node_modules` 里仍是旧构建
（248229 B，旧规则还在），页面看起来「改了没效果」。必须：

```powershell
& $cli plugin --profile <p> remove @dsh-external/dsh-taffy-theme
& $cli plugin --profile <p> add .\dsh-external-dsh-taffy-theme-0.1.9.tgz
```

验证方式：确认装好的 `lib/client.js` 字节数与仓库最新构建一致，
或直接查新加的 token 是否在文件里。

已同步写入 `docs/DESKTOP-ACCEPTANCE-RUNBOOK.md`。
