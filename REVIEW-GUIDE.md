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

### 4.1 `data-pane` 是死锚点，却用了 224 次 ★最大一条

用真实的 0.2.1-rc.2 客户端 bundle（20 个文件、合计 2.0 MB）逐个属性核对，
**`data-pane` 出现 0 次** —— 宿主根本不设置它。而本仓库里：

| 文件 | 次数 |
| --- | --- |
| `src/client/theme-css.ts` | 111 |
| `src/theme/components.css` | 92 |
| `src/theme/motion.css` | 12 |
| `src/theme/tokens.css` | 6 |
| `src/client/chrome-selectors.ts` | 1 |
| `src/client/conversation-metrics.ts` | 1 |

也就是说 `[data-pane='sidebar']`、`[data-pane='conversation']` 这类选择器**一条都不生效**，
对应的样式是死代码。`chrome-selectors.ts` 已经改用经验证的锚点，**但 CSS 没有同步**。
这是最值得先做的一件事：要么换成活锚点，要么删掉。

### 4.2 另外两个死锚点

| 属性 | 本仓库使用次数 | 实测出现次数 | 建议替代 |
| --- | --- | --- | --- |
| `data-input-mirror` | 3 | **0** | `data-composer-card`（live，1） |
| `data-dsh-floating-panel-open` | 7 | **0** | `data-sidebar-right-open`（live，5）或 `data-dockkit-float`（live，7） |

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

需要可安装产物就用 `npm pack`；需要在本机跑验收流程见 `docs/DESKTOP-ACCEPTANCE-RUNBOOK.md`。

---

## 6. 一句话给评审者

**代码是能跑的，工程门禁是齐的；最值得动手的是 §4.1 那 224 处死选择器，
以及 §4.3 那个可能是官方正道的 `data-plugin-css`。**
