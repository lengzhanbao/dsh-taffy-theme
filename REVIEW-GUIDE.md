# 评审说明 —— dsh-taffy-theme

给拿到这份代码的人：这是一份 **DSH（DeepSeek Harness）主题插件的源码快照**，
目标是让它跑在**官方 DSH Desktop 0.2.1-rc.2** 上。

- 版本：`0.1.9`
- 分支：`compat/dsh-0.2.x`
- 打包来源：`git archive HEAD`，即**版本控制里的确切内容**，无 `node_modules`、无构建缓存
- 打包时的 commit 与 SHA-256 见交付时附的说明

如果你是来看「哪里可以优化」的，直接跳到 **[§4 已知可优化点](#4-已知可优化点有证据)** ——
那一节每条都有实测依据，不是猜测。

---

## 1. 这是什么插件

Cordis 架构的 DSH 插件，分两半：

| 半边 | 入口 | 干什么 |
| --- | --- | --- |
| host 半 | `lib/index.js` ← `src/index.ts` | 注册素材 HTTP 路由、在 `index.html` 注入启动标记、提供 agent preset |
| client 半 | `lib/client.js` ← `src/client/index.ts` | 在渲染进程里注入主题 CSS、挂装饰节点、装饰侧栏与输入框 |

客户端半通过 `window.__ModuleLoader__.load({ id, factory })` 注册，由宿主加载。

---

## 2. 当前验证状态（请照实引用，别升级措辞）

### 已通过

| 项 | 证据 |
| --- | --- |
| 工程门禁 | `npm run ci` → exit 0：peers / preset / assets / static 检查 + 119 个单测 + 打包 56 项 |
| 安装门（桌面运行时） | 用桌面安装包自带的 CLI（`resources/runtime/cli`，pnpm 11.28.5）在隔离 `DSH_HOME` 下 `plugin add` → **exit 0** |
| 素材路由（桌面运行时） | `/plugins/<id>/assets/taffy/*.webp` → **200 `image/webp`**，字节完整；路径穿越 → 404 |
| 桌面外壳转发机制 | 源码级确认：`dsh-app://app` 只白名单静态文件，其余（含 `/plugins/**`）**转发给 Host 并注入鉴权 cookie** |
| 浏览器端（Web profile） | 真实 Chromium 10/10：标记、样式节点、15 个装饰节点、token 生效、状态机在跑、无异常 |
| **真实桌面实例内可用** | **由使用者人工确认「有用」** —— 装进真实 DSH Desktop 后界面生效 |

### 未通过仪器化验证

| 项 | 说明 |
| --- | --- |
| Electron 渲染进程内的仪器化取证 | 探针（`scripts/desktop-accept.mjs`）已备好并自测通过，但尚未在真实桌面实例上跑过（需要带 `--remote-debugging-port` 重启应用） |
| 设置持久化 / 卸载残留 / 重装 | 同上 |

> **请不要**把这份代码描述成「已在 DSH Desktop 完整验证」。
> 准确说法是：**装载层与素材路由已实测通过，渲染效果已由使用者人工确认，仪器化取证待补**。

---

## 3. 代码地图

```
src/
  index.ts              host 入口：服务注册、启动标记注入
  config.ts             配置 schema（显式接口，不泄漏框架类型）
  boot-taffy.ts         启动阶段逻辑
  assets/
    route.ts            素材 HTTP 路由（含路径规范化）
    manifest.ts         素材 URL 构造 —— PLUGIN_ASSET_ROUTE_PREFIX 与路由共用同一常量
    trust-fence.ts      只放行回环 Host 的本地信任栅栏
  prompt/               注入给 agent 的系统提示词
  client/
    index.ts            client 入口：apply() 永不抛错、disposeAll() 幂等
    chrome-selectors.ts DOM 锚点集中定义（已剔除死选择器）
    theme-css.ts        ⚠ 110 KB 生成文件（由 src/theme/*.css 生成），见 §4.6
    styles.ts           样式节点注入（STYLE_ID = dsh-taffy-theme-style）
    settings-store.ts   设置持久化，含存储不可用时的降级兜底
    ...                 装饰节点、投影状态、指标计算等
  theme/                tokens.css / components.css / motion.css —— 真正的样式源
  state/adapter.ts      只产出 idle / streaming / tool-calling
presets/                agent preset（0.2.x 新格式）
scripts/                构建与门禁脚本（verify-*.mjs）
tests/                  119 个单测
docs/                   审计与证据文档，含 DESKTOP-*.md
```

构建：`npm run build:ci`（跨平台，与 `build.ps1` 产物逐字节一致）
门禁：`npm run ci`

---

## 4. 已知可优化点（有证据）

### 4.1 三个宿主不存在的属性：是冗余项，不是坏样式 ★先看这条更正

用真实的 0.2.1-rc.2 客户端 bundle（20 个文件、合计 2.0 MB）逐个属性核对，
下面三个属性在宿主里**出现 0 次**，也就是宿主根本不设置它们：

| 属性 | 本仓库引用 | 实测 |
| --- | --- | --- |
| `data-pane` | 224 | **0** |
| `data-input-mirror` | 3 | **0** |
| `data-dsh-floating-panel-open` | 7 | **0** |

**但结论不是「这些规则全都不生效」。** 逐个看语境后发现：

| 语境 | 数量 | 后果 |
| --- | --- | --- |
| 写在 `:is(...)` / `:where(...)` 里，同组还有活项（如 `[class*='sidebarCol']`） | **216** | 规则**照常生效**，只是多了一个永不适配的项 |
| 写在逗号分隔的选择器列表里，同列表还有活项 | 其余 | 同上 |
| 裸用、没有任何活替代 | **1** | 真的匹配不到，见下 |

典型写法：

```css
body[data-dsh-taffy-theme] :is([data-pane='sidebar'], [class*='sidebarCol']) { … }
/*                                    ↑ 死的            ↑ 活的，规则靠它生效 */
```

`:is()` 的匹配是「任一成立即可」，所以死项**不会让规则失效**。
这类东西的价值在**可读性与可维护性**（读代码的人会被误导、改动时容易踩空），
**不是**在修坏掉的样式。

#### 唯一一处真的落空

`src/client/conversation-metrics.ts:122`：

```ts
const preferred = asElement(doc.querySelector("[data-pane='conversation']"))
if (preferred && visibleWidth(preferred) > 0) return preferred
// 回退：在 CONVERSATION_SELECTOR 候选里取最宽的那个
```

这个 `querySelector` **永远返回 null**，于是每次都走回退分支。
**没有功能 bug**（回退逻辑是完整的、按宽度选最合适的面板），
但这是一次白做的查询，而且读代码的人会以为首选路径在工作。

#### 补充：`data-dsh-floating-panel-open` 其实不是死的

它由**本插件自己**设置（`src/client/projected-state.ts` 里的 `body.toggleAttribute(...)`）。
所以功能上是活的。真正的问题是**命名**：它借用了宿主的 `data-dsh-` 前缀，
而它并不是宿主提供的属性，容易和上面两个混淆。

> **更正说明**：本文件早期版本写过「224 处规则一条都不生效，是死代码」。
> 那是把「死项」当成了「死规则」，结论错误。上面的数字与分类是重新逐个核对语境后得出的。

### 4.2 建议的清理方式

因为不是坏样式，**不要**为了它做大规模重写。低成本做法：

1. 从 `:is()` 列表里删掉 `[data-pane='…']` 项 —— 纯删除，不改语义、不改特异性
   （`:is()` 取参数里最高特异性，而属性选择器与 `[class*=…]` 同为 (0,1,0)，删掉不影响层叠）。
2. 修掉 §4.1 那处落空的查询（要么删掉首选分支，要么换成活锚点）。
3. 把 `data-dsh-floating-panel-open` 改名为 `data-taffy-floating-panel-open`，与我们自己的命名空间一致。

这三步都是纯机械改动，适合单独一个 commit，不要和视觉改动混在一起。

### 4.3 宿主有 `data-plugin-css`，而我手工注入样式 ★值得调查

宿主 bundle 里 `data-plugin-css` 出现 **43 次**，是本仓库从未使用过的机制。
如果它是官方的插件样式注册入口，那么现在这种「自己 `createElement('style')` 塞 110 KB 文本」
的做法可能应该换掉 —— 好处是能拿到宿主的生命周期、去重与卸载语义，
而不是靠 `disposeAll()` 自己拆。

**这一条我没有验证过**，只是发现线索，请评审者优先确认。

### 4.4 一批活锚点完全没用

同样是实测计数（live = 宿主确实会设置）：

| 属性 | 出现次数 | 可能用途 |
| --- | --- | --- |
| `data-chat-flow-kind` | 19 | 比现在只用 `data-chat-flow` 更精确地区分消息类型 |
| `data-chat-motion` | 20 | 宿主自己的动效开关，可用来对齐 `prefers-reduced-motion` |
| `data-platform` | 25 | 区分平台，可用于桌面/网页差异化 |
| `data-content-phase` | 5 | 内容阶段，可能比自定义 `data-taffy-state` 更可靠 |
| `data-chat-turn` / `data-chat-anchor-key` | 4 / 6 | 轮次与锚点 |
| `data-dockkit-pane` / `data-dockkit-float` / `data-dockkit-host` | 7 / 7 / 6 | 面板停靠系统，比 `data-sidebar-right-panel` 更本质 |
| `data-sidebar-right-open` | 5 | 比自定义的 `data-taffy-details-open` 启发式更直接 |
| `data-windows-titlebar` | 11 | 桌面版标题栏 |

### 4.5 已确认**活着**的锚点（可以放心用）

`data-chat-flow`(24)、`data-slot`(18)、`sidebarCol`(17)、`data-ds-dark-theme`(12)、
`data-conversation-scroll`(10)、`data-phase`(9)、`data-sidebar-right-panel`(7)、
`centerCol`(7)、`data-sidebar-collapsed`(4)、`data-tool`(3)、`data-rightbar-col`(2)、
`data-composer-card`(1)、`role="tablist"`(1)

> 注：`sidebarCol` / `centerCol` 是类名**片段**，用 `[class*='...']` 匹配是有效的。

### 4.6 `theme-css.ts` 是 110 KB 的生成文件，且在版本控制里

`src/client/theme-css.ts` 由 `src/theme/*.css` 生成，单文件 110 KB，
里面是超长单行字符串。后果：diff 不可读、grep 输出爆炸、评审困难。
建议改成构建期生成、不入库（或至少拆行）。

### 4.7 其他

- `src/theme/components.css` 55 KB 单文件，可考虑按组件拆分。
- 状态机目前只产出 `idle` / `streaming` / `tool-calling`，而 CSS 里
  `data-taffy-state` 的消费者只有 `[data-composer-card]` 一处 —— 状态能力大于实际使用。
- 视觉升级（星夜蓝紫配色、光效、交互特效）尚未开始，属于**已知的下一步**，
  不是缺陷。

---

## 5. 打包里没有什么

- 没有 `node_modules`（`schemastery` 是唯一真实依赖，其余 12 个都是 peer）
- 没有 `.git`
- 没有 `*.tgz` 安装包
- **没有 25 个 PNG 源图（16.1 MB）** —— 它们在 `assets/taffy/` 下，是作画源文件，
  **不会被打进安装包**（`package.json` 的 `files` 只收 `*.webp`）。
  真正上线的 `.webp` 素材都在，所以看视觉呈现不受影响。

需要可安装产物就用 `npm pack`；需要在本机跑验收流程见 `docs/DESKTOP-ACCEPTANCE-RUNBOOK.md`。

---

## 6. 一句话给评审者

**代码是能跑的，工程门禁是齐的。**
最值得花时间的是 **§4.3**：宿主里有 43 次 `data-plugin-css`，而本仓库从未使用 ——
如果那确实是官方的插件样式机制，现在这套「自己注入 110 KB `<style>`」的做法就该换掉。

§4.1 那批宿主不存在的属性是**冗余项而非坏样式**（含一处更正说明），
机械清理即可，不要为它做大规模重写。
