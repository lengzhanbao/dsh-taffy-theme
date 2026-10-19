# Taffy × DSH 0.2.x 兼容性核查报告

> 核查时间：2026-10-19
> 核查对象：`lengzhanbao/dsh-taffy-theme@0.1.9`（`eaf41e0`）→ DSH `0.2.1-rc.2`
> 方法：npm registry 实测 + 真实 0.2.1-rc.2 包体下载解包 + 类型声明读源 + DOM 锚点 grep
> 性质：**静态核查**。未在本机运行 0.2.1-rc.2，未做浏览器验证。

---

## 0. 结论

1. **`0.2.1-rc.2` 真实存在**，且是 `@deepseek-ai/*` 全部包当前的 `next` tag。计划里的版本前提成立。
2. **0.1.9 不能直接声明兼容 0.2.x** —— 但原因**不是**依赖范围"卡在 0.2.0-0"，而是**有一个包改名了**。
3. 计划里的 **`ctx.theme.overrideTokens` 写法经真机类型验证是成立的**（含"必须同时给 light/dark"这条）。
4. **重要修正**：我上一份评审建议"删掉 `dsh-client-ui-slots`"——在 0.2.x 语境下这条要改。该包在 0.2.x **已恢复发布**。
5. **Taffy 现有的一批死选择器在 0.1.6 和 0.2.1 上都是死的**。所以那部分不是"迁移成本"，是**既有 bug**；不修它，迁到 0.2.x 一样不工作。
6. **桌面版**：安装门与素材路由已在桌面自带运行时上实测通过（§3.7.2），转发路径有源码实证；
   但**渲染进程内的实际渲染尚未观测**，因此目前只能声明「桌面运行时装载层兼容」，
   **不能**声明「已在 DSH Desktop 中完整验证」。

---

## 1. 已验证的事实

### 1.1 版本现状（npm dist-tags 实测）

| 包 | latest | next | alpha |
| --- | --- | --- | --- |
| `dsh` | `0.2.0-rc.2` | **`0.2.1-rc.2`** | `0.2.1-alpha.5` |
| `dsh-client-ui-theme` | `0.0.1-rc.1` | **`0.2.1-rc.2`** | `0.2.1-alpha.5` |
| `dsh-client-ui-renderer` | `0.1.0-rc.8` | **`0.2.1-rc.2`** | `0.2.1-alpha.5` |
| `dsh-client-ui-slots` | `0.0.1-rc.1` | **`0.2.1-rc.2`** | `0.2.1-alpha.5` |
| `dsh-host-webserver` | `0.0.1-rc.1` | **`0.2.1-rc.2`** | `0.2.1-alpha.5` |

⚠️ **不要用 `latest` 判断**：`latest` 多数停在 `0.0.1-rc.1` / `0.1.0-rc.8`，真正的新版在 **`next`**。`npm install @deepseek-ai/dsh` 默认拿不到 0.2.x。

> 注：`api.github.com/repos/deepseek-ai/deepseek-harness` 本次返回 403（此前同一 token 的 GitHub API 调用可用，判定为未认证限流），故本报告的版本结论全部来自 npm registry，不依赖 GitHub API。

### 1.2 Taffy 声明的 10 个 peer 在 0.2.1-rc.2 上的存活情况

| peer | 0.2.x 是否存在 | 备注 |
| --- | --- | --- |
| `@deepseek-ai/cordis` | ✅（4.0.5） | cordis 走独立版本线，非 0.2.x。`^4.0.1` 语法上允许 4.0.5，但需更新 lock |
| **`@deepseek-ai/dsh-agent-presets`** | ❌ **无 0.2.x** | 停在 `0.1.5-rc.3` → **已改名为单数 `dsh-agent-preset`** |
| `dsh-client-locale` | ✅ | 0.2.1-rc.2 |
| `dsh-client-ui-renderer` | ✅ | 0.2.1-rc.2 |
| `dsh-client-ui-settings` | ✅ | 0.2.1-rc.2 |
| `dsh-client-ui-settings-general` | ✅ | 0.2.1-rc.2 |
| `dsh-client-ui-slots` | ✅ | 0.2.1-rc.2 —— **注意：0.1.6-alpha.1 里没有，0.2.x 里回来了** |
| `dsh-client-ui-theme` | ✅ | 0.2.1-rc.2 |
| `dsh-settings` | ✅ | 0.2.1-rc.2 |
| `dsh-tools` | ✅ | 0.2.1-rc.2 |

**唯一的硬断点是 `dsh-agent-presets` → `dsh-agent-preset`（单复数）**：
```
dsh-agent-presets   next=0.1.5-rc.3    有 0.2.x = False
dsh-agent-preset    next=0.2.1-rc.2    有 0.2.x = True
```

这条影响面比"版本号"大得多：Taffy 不只是声明依赖，它还**发布** `presets/taffy/agent.cordis.yml` + `presets/taffy/preset.yml`，并且 `scripts/sync-persona.mjs` 会把 persona 注入 preset。**preset 的文件格式与挂载方式在 0.2.x 是否变化，必须对着 `dsh-agent-preset@0.2.1-rc.2` 重新核对**（本次未做，属未验证项）。

### 1.3 `ctx.theme` API —— 计划里的写法成立

从 `@deepseek-ai/dsh-client-ui-theme@0.2.1-rc.2` 的 `lib/types/client/index.d.ts` 实读到（摘录）：

```ts
export interface ThemeTokenModes {
    light: string;   // Value applied while the light base palette is active.
    dark: string;    // Value applied while the dark base palette is active.
}
export type ThemeTokenOverrides = Record<string, ThemeTokenModes>

overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void
register(definition: ThemeDefinition): () => void
```
```ts
declare module '@deepseek-ai/cordis' {
  interface Context { theme: ThemeRuntime }
  interface Events { 'theme/change'(snapshot: ThemeSnapshot): void }
}
```

对应地，计划中提出的三个注意点**全部正确**：

| 计划的说法 | 实测 |
| --- | --- |
| 必须同时提供 `light` 和 `dark`，不能传单个字符串 | ✅ 类型强制 `{light, dark}`；文档原文：*"both palette modes are mandatory … a bare string value throws a teaching error"* |
| `overrideTokens` 返回清理函数 | ✅ 返回 `() => void`，交给 `ctx.effect` 即可 |
| 颜色语义由 `--dsw-alias-*` 承载 | ✅ `ThemeTokens = Record<string, string>`，doc 明确其为 "`--dsw-alias-*` overrides" |

另外两条计划没提到、但同样重要的机制：

- **同一个 `source` 再次调用会整层替换并重排到最上层**（"effect re-registration semantics"）→ 用户在设置里换配色时，直接以同一 source 再调一次即可，不用手动 remove。
- **`colorScheme` 由 `register()` 的字段决定，`body[data-ds-dark-theme]` 由 presenter 切换**（原文："the presenter switches `body[data-ds-dark-theme]` from this field — never from the id"）→ 一旦接上官方主题，Taffy 现在那套 `MutationObserver` 监听 `data-ds-dark-theme` 的夜间判定（`backdrop.ts`）就**应该删掉**，而不是保留成两套真相。
- 该包 peer 要求 `@deepseek-ai/cordis@~4.0.5`，本机安装的是 **4.0.2**。

### 1.4 DOM 锚点：0.2.1-rc.2 实测

| 锚点 | 0.2.1-rc.2 | 所属包 | Taffy 0.1.9 是否在用 |
| --- | --- | --- | --- |
| `data-pane` | **GONE** | — | ✅ 在用（`DETAILS/SIDEBAR/CONVERSATION` 主锚点） |
| `detailsCol` | **GONE** | — | ✅ 在用（右栏兜底） |
| `data-tool-call` | **GONE** | — | ✅ 在用（`tool-calling` 状态） |
| `sidebarCol` | EXISTS | `ui-layout`（哈希类名） | ✅ 在用（兜底，命中） |
| `data-rightbar-col` | EXISTS | `ui-layout` | ❌ 未用 |
| `data-sidebar-right-panel` | EXISTS | `ui-sidebar-right` | ❌ 未用 |
| `data-sidebar-collapsed` | EXISTS | `ui-layout` | ❌ 未用（现用错误的 `data-dsh-sidebar-collapsed`） |
| `data-tool` | EXISTS | `ui-tool` | ❌ 未用 |
| `data-phase` | EXISTS | `ui-conversation` | ✅ 在用 |
| `data-chat-flow` | EXISTS | `ui-chat` | ✅ 在用 |
| `data-streaming` | EXISTS | `ui-chat` | ✅ 在用 |
| `data-composer-card` | EXISTS | `ui-conversation` | ✅ 在用 |
| `data-slot` | EXISTS | renderer | ✅ 在用 |
| `data-ds-dark-theme` | EXISTS | theme / layout | ✅ 在用 |

> 过程纠错：我第一轮只扫了 layout/conversation/chat/tool 四个包，误报 `data-sidebar-right-panel` 为 GONE；补扫 `ui-sidebar-right` 后确认它 **EXISTS**。此处已修正。

**关键结论**：`data-pane` / `detailsCol` / `data-tool-call` 这三个死锚点，在 **0.1.6-alpha.1 和 0.2.1-rc.2 上都是死的**。也就是说 —— Taffy 今天的「右栏不被主题化」「tool-calling 状态永不触发」**不是升级到 0.2.x 才出现的问题，而是既有 bug**。迁到 0.2.x 不会让它变好，也不会让它变坏。

这条对排期影响很大：把 DOM 修复放进「阶段 A 兼容迁移」会让人误以为它是版本适配成本；实际上它是**独立的技术债**，且修法在两版上完全一致。

---

## 2. 「阶段 A」应该怎么排

我认同计划的拆分思路（先兼容、后美化），但建议调整阶段 A 的内部顺序：

| 原计划顺序 | 建议顺序 | 理由 |
| --- | --- | --- |
| ① 迁移 `ctx.theme` | ③ 迁移 `ctx.theme` | 这是**收益最大但风险也最高**的改动。等死链路修完再上，出问题容易定位 |
| ② 重构 DOM 适配 | **① 先修既有死锚点** | 与版本无关的技术债，且在 0.2.x 上同样必需；改动小、可单独验证 |
| ③ 重核依赖链 | **② 改名 + 依赖链** | `dsh-agent-presets`→`dsh-agent-preset` 是**唯一的硬阻断**，必须先解 |
| ④ 验证 | ④ 验证 | 不变 |

### 具体动作清单

**② 依赖链（硬阻断，先做）**
1. `@deepseek-ai/dsh-agent-presets` → `@deepseek-ai/dsh-agent-preset`（peer + 任何 import + `presets/` 消费逻辑）
2. `dsh-client-ui-slots`：**恢复为有效 peer**（0.2.x 有），但 `dsh.client.inject` 里是否仍需保留要按 0.2.x 的 client 组合重新判断 —— 上一版我建议"删掉"，仅对 0.1.6-alpha.1 成立
3. 补 `@deepseek-ai/dsh-host-webserver`（`src/index.ts:2`、`route.ts:76` 真实依赖，但从未声明）
4. cordis 对齐 `~4.0.5`；重建 lock（当前 lock 是 `0.1.0-rc.8` 化石）
5. 全部 peer 范围改成能覆盖预发布的形式（`>=0.2.1-rc.2 <0.3.0` 或显式 OR），并加 `verify:peers.mjs` 门禁

**① DOM 死锚点（与版本无关，可先做）**
- `DETAILS_SELECTOR` → `[data-sidebar-right-panel], [data-rightbar-col]`
- `TOOL_CALL_SELECTOR` → `[data-tool]`（错误态 `[data-error]`）
- 收缩判定 → `[data-sidebar-collapsed]`
- `WORKSPACE_SELECTOR` 去掉不存在的 `header` 前缀
- 加「宿主契约」测试，防静默回归

**③ `ctx.theme` 迁移**
- `inject` 加 `theme`；`overrideTokens(pkgId, {token: {light, dark}})` 包进 `ctx.effect`
- 删掉自建的 `--dsw-alias-*` 覆盖与 `backdrop.ts` 的 `data-ds-dark-theme` 观察
- 保留 Taffy 自有装饰变量（`--taffy-*`），不冒充官方 token
- 用户配色预设 → 转成 override layer（同 source 重复调用即替换）

---

## 3. 未验证项（必须先做，再谈发布）

| 项 | 状态 |
| --- | --- |
| 在本机安装并运行 DSH `0.2.1-rc.2` | ❌ 未做（本机为 0.1.6-alpha.1） |
| `presets/` 与 `dsh-agent-preset@0.2.1-rc.2` 的文件格式/挂载方式是否兼容 | ❌ 未核对 |
| 0.2.x 的 client 插件「未 active 即整体 boot 失败」语义是否仍成立 | ❌ 未复核（若仍成立，则 `localStorage` 未保护那条 P0 在 0.2.x 同样是全局风险） |
| 浏览器端实际渲染、浅色/深色切换、窄窗口、reduced-motion | ❌ 未做 |
| `ctx.theme` 在本机 cordis 4.0.2 上能否用（还是必须 4.0.5） | ❌ 未验证 |

**这些没有跑通之前，不要发布任何「兼容 0.2.x」的声明。**

---

## 3.5 【阶段 C 实测补充】Preset 机制不是改名，是重构 —— 当前 preset 在 0.2.x 上不可用

阶段 C 实施时对 preset 做了实测，结论比"改包名"严重得多：

| 事实 | 证据 |
| --- | --- |
| `dsh-agent-presets`（复数）停在 `0.1.5-rc.3` | npm dist-tags |
| `dsh-agent-preset`（单数）在 0.2.x | `next=0.2.1-rc.2` |
| **旧的 preset 发现约定已废弃** | 本机 `dsh-agent-presets@0.1.6-alpha.1` 的 `lib/index.js` 命中 `.agent-presets` 1 次、`preset.yml` 1 次；而 `dsh-agent-preset-registry@0.2.1-rc.2` 对这两个串**命中 0 次** |
| 0.2.x 的 preset 是**注册表服务** | `dsh-agent-preset-registry` 暴露 `resolve(id)` / `readDocument()` / roster，并经 typert 提供 `agentPresets/list|read|select` |
| 0.2.x 的 preset 声明形状 | `PresetDefinition { id, name?, description?, order?, plugins: EntryOptions[] }`（`definition.d.ts`） |
| 注册方式 | 一个 Cordis 行 `{ name: '@deepseek-ai/dsh-agent-preset', config: <PresetDefinition> }`（该包 default export 是插件类，`Config = PresetDefinition`） |
| 新增依赖包 | `@deepseek-ai/dsh-agent-preset-registry@0.2.1-rc.2` |

**Taffy 现状**：`presets/taffy/preset.yml`（name/description/order）+ `presets/taffy/agent.cordis.yml`（460 行 entry list），由 `scripts/sync-persona.mjs` 安装到 `$DSH_HOME/.agent-presets/taffy` —— 这是 **0.1.x 的文件系统约定**。

**好消息（已用官方校验器实测，不再只是"应该可以"）**：新增 `scripts/verify-preset.mjs`，用 0.2.x **自带的** `entryListProblem()`（来自 `dsh-agent-preset-registry@0.2.1-rc.2` 的主入口导出）校验 Taffy 的 `agent.cordis.yml`：

```
✓ agent.cordis.yml 解析为 entry list（数组） — 16 行
✓ 官方 entryListProblem 通过
✓ 每行都有 name — 16/16
✓ 可组装为 PresetDefinition   (id=taffy name=Taffy 塔菲 plugins=16)
```

并确认该校验器**不是空转**：非数组 → `the composition must be a top-level list of plugin rows`；行缺 `name` → `row 1 names no plugin`；畸形行 → `row 1 is not a plugin row`。

**结论**：preset 的**内容**是前向兼容的（0.2.x 官方校验器认可），**变的只是打包与注册方式**。`verify:preset` 已接入 `npm run ci`。

**实现细节（踩过的坑）**：Cordis 给 YAML 加了 `!!js` 标签（如 `disabled: !!js process.platform === 'win32'`），普通 `js-yaml` 会直接抛错；必须注册该标签，并构造成 loader 期望的形状 —— `@deepseek-ai/cordis-plugin-loader` 把 JsExpr 定义为 `{ __jsExpr: string }`（`utils.d.ts:8`）。另外 `js-yaml` 要钉 `^4.3.2`：5.x 已重写 API，没有 `DEFAULT_SCHEMA`/`Type`。

**因此本轮没有把 peer 改成单数包**：改名而不迁移注册方式，只会得到一个"声称支持、实际加载不了"的 preset —— 正是要避免的失败模式。当前 `@deepseek-ai/dsh-agent-presets` 被标为 **optional peer 且限定在 0.1.x 线**，如实反映"随包发布的 preset 目前只适用于 0.1.x 约定"。

**迁移需要的动作**（待 0.2.x 实机验证）：
1. 把 `preset.yml` + `agent.cordis.yml` 合成一个 `PresetDefinition`；
2. 通过主题的 `cordis.patch.yml` 插入一行 `@deepseek-ai/dsh-agent-preset`（需先在实机确认第三方插件能否向 roster 注册 preset）；
3. `sync-persona.mjs` 不再写 `$DSH_HOME/.agent-presets/`；
4. 用 `entryListProblem()` 在门禁里校验行列表；
5. 验证 persona 注入后 `AgentPresetDocument.content` 与 `src/prompt/taffy-system.md` 一致。

---

## 3.6 【阶段 D 实测补充】`overrideTokens` 会把配色从"列内"扩大到"全局"——不能照搬

评审曾建议"接 `ctx.theme`，删掉自建 `--dsw-alias-*` 覆盖"。实测后这条**需要修正**：

**证据**：`dsh-client-ui-layout@0.2.1-rc.2` 的 presenter 把主题 token **全局写在 `body` 上**：

```js
// ui-layout/lib/client.js:553-565
if (scheme === "dark") body.setAttribute(DARK_ATTRIBUTE, ""); else body.removeAttribute(DARK_ATTRIBUTE);
...
for (const name of this.appliedTokens) body.style.removeProperty(name);
for (const [name, value] of Object.entries(snapshot.active.tokens)) {
  body.style.setProperty(name, value);
  this.appliedTokens.push(name);
}
```

而 Taffy 现在的 53 处 `--dsw-alias-*`（`tokens.css`）＋19 处（`components.css`）是写在
`body[data-dsh-taffy-theme] :is([class*='sidebarCol'], [class*='centerCol'], …)` **作用域内**的，
这是刻意的：列外（浮层、对话框、第三方插件面板）保持原生外观，与 README「亚克力 opt-in、不误伤第三方插件」一致。

**结论**：把这一整套搬到 `overrideTokens` 会把这些颜色**全局化**，改变列外的渲染 —— 属于用户明确排除的"大规模视觉改版"，且与项目自身的不误伤纪律冲突。CSS 变量在列元素上声明会覆盖 body 的继承值，所以**列内渲染本来就不会变**；变的只有列外。

**因此本轮只做了无争议的部分**：
- `theme/change` 订阅（替代观察 `data-ds-dark-theme`）；理由是 presenter 正是**因为**这个事件才设置该属性，观察属性等于对同一个信号做二次间接推导；
- 类型合并 `import type {} from '@deepseek-ai/dsh-client-ui-theme/client'`（获得 `ctx.theme` 与 `theme/change` 的类型）；
- `backdrop.ts` 不再观察 `data-ds-dark-theme`，只保留本主题自己的两个属性。

**`overrideTokens` / `register` 是否启用，需要一次明确的取舍**（建议单独一轮，配浅色/深色真实截图对比列外区域），因为它会改变对话框与第三方面板的观感。

**另一个设计决定**：主题集成走 `ctx.inject(['theme'], …)` 而**不是**模块级 `inject` 数组。因为 DSH 的 boot 判定是"任一客户端条目未 `active` 即整体失败"，若把 `theme` 列为必需依赖而宿主未提供该服务，条目会停在 pending → **整个 Web UI 打不开**。用 `ctx.inject` 让集成保持"有机会就用"，永远不会阻塞激活。测试已覆盖"`ctx.theme` 缺席时主题仍正常启用"。

---

## 3.7 【实机验收】DSH 0.2.1-rc.2 隔离环境实测 —— `engines.dsh` 是安装开关

本轮在本机搭了一个**完全隔离**的 DSH `0.2.1-rc.2` 环境（`DSH_HOME` 重定向到临时目录，未触碰用户 profile），把本分支打包后真实安装并启动。结果：

### 第一次安装：被 DSH 主动拒绝

```
dsh: installation rejected: Plugin @dsh-external/dsh-taffy-theme@0.1.9 is incompatible
with dsh 0.2.1-rc.2: requirements {"@deepseek-ai/dsh-agent-presets":">=0.1.6-alpha.1 <0.2.0"}.
```

**DSH 0.2.x 有强制兼容门禁，没声明 `engines.dsh` 时会回退到 peerDependencies 判定并拒绝安装。** 被拒的正是我按"只支持 0.1.x"如实保留的那个 preset peer —— 也就是说「诚实地把范围收窄」在这种情况下等价于「装不上」。

### 判定规则的源码（`dsh-app-boot/lib/index.js:279-299`）

```js
function unmetRequirements(fields, runtimeVersion) {
  const engines = fields.engines ?? {}
  if (Object.hasOwn(engines, 'dsh')) {                    // ← 单独决定
    return satisfies(runtimeVersion, engines.dsh) ? {} : { 'engines.dsh': engines.dsh }
  }
  if (!Object.hasOwn(fields, 'peerDependencies')) return {}
  for (const [name, range] of Object.entries(fields.peerDependencies)) {
    if (name !== '@deepseek-ai/dsh' && !name.startsWith('@deepseek-ai/dsh-')) continue
    if (!satisfies(runtimeVersion, range)) unmet[name] = range
  }
  return unmet
}
function satisfies(runtimeVersion, range) {
  return range.trim() !== '' && semver.satisfies(runtimeVersion, range, { includePrerelease: true })
}
```

三条要点：
1. **`engines.dsh` 存在时单独决定，`peerDependencies` 被完全忽略**；
2. 回退判定**只看 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*`** —— `@deepseek-ai/cordis` 不参与；
3. 用 `includePrerelease: true`，比 npm 的规则**更宽**。`verify:peers` 因此两套规则都查。

### 加上 `engines.dsh` 之后：安装并成功加载

```jsonc
"engines": { "dsh": ">=0.1.6-alpha.1 <0.2.0 || >=0.2.1-rc.2 <0.3.0" }
```

| 验收项 | 结果 |
| --- | --- |
| `dsh plugin --profile web add <tgz>` | ✅ exit 0，不再拒绝 |
| profile `dsh.profile.bundles` 收录 | ✅ |
| `--dump-config` 组合树含 `dsh-taffy-theme` 行 | ✅ |
| **启动 `dsh web`** | ✅ `http://127.0.0.1:3080/?token=…`，**stderr 为空**，进程稳定 |
| **host 资产路由** `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/avatar.webp` | ✅ **HTTP 200, `image/webp`, 123,606 bytes** |

最后一条是关键证据：资产路由由 host 端 `apply()` 里的 `webServer.register` 注册，能返回真实图片就证明 **host 插件在 0.2.1-rc.2 上确实完成挂载并执行了 `apply`**。

### 仍未验证的

- **浏览器端**：首页 HTML 需要带 token 鉴权，本次抓取返回 401，未能确认 `tapIndex` 的 boot veil 注入；客户端插件的实际渲染、设置面板、主题切换都需要真实浏览器。
- **preset 在 0.2.x 的注册**：内容已通过官方校验（§3.5），但「第三方插件能否向 roster 注册 preset」仍需实机确认。
- 因此**仍不能宣称「兼容 0.2.x」**。可以说的是：**host 端在 0.2.1-rc.2 上可安装、可启动、可服务资产**。

---

**迁移配方（已在隔离的 0.2.1-rc.2 上实测通过）**：DSH 自己就是这么声明 preset 的 —— `dsh-web-app/package.json` 的 `dsh.bundle.patch` 列出 `./presets/{standard,ptc,minimal,cordis}.patch.yml`，每个文件形如：

```yaml
- insert:
    - id: preset-standard
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: standard
        order: 1
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            ...
```

即 **`plugins:` 就是 Taffy 现有 `agent.cordis.yml` 的行列表**。实验：把 Taffy 的 16 行原样缩进 10 空格塞进这个信封，写进隔离 profile 的 patch 层后启动：

| 观察 | 结果 |
| --- | --- |
| 启动 | ✅ 成功，**stderr 为空**，进程稳定 |
| `--dump-config` 组合树 | ✅ **1233 → 1762 行**（+529 = Taffy 的 preset 行） |
| `preset-taffy` 行 | ✅ `name: '@deepseek-ai/dsh-agent-preset'` + `config: {id: taffy, order: 9, plugins: […]}`，与 `preset-standard` 结构完全一致 |

**机制已确认可用，内容零改写。**

**但有一个取舍必须先决定**：把 `presets/taffy.patch.yml` 加进 `dsh.bundle.patch` 后，**0.1.x 会解析到 `@deepseek-ai/dsh-agent-preset`（单数）—— 那个包在 0.1.x 不存在**，会变成加载错误。也就是说：

- 想同时支持 0.1.x 与 0.2.x 的 preset → 需要按版本条件禁用该行（`disabled: !!js …`），复杂度上升且未验证；
- 只支持 0.2.x → 直接加，干净。

**因此本轮没有把 patch 文件写进仓库**：这是"服务哪些用户"的产品决定，不该由我替你做。配方与实测结果已备好，随时可落。

---

### 3.7.1 浏览器端验收 —— 10/10 通过（真实 Chromium/Edge）

用 `playwright-core` 驱动本机 Edge，打开隔离环境的 token URL。**取得了此前所有静态分析都拿不到的证据**：

```
✓ 页面已加载（非空白） — DeepSeek Harness
✓ 启动判定：客户端插件未失败 — no boot-failure text
✓ html[data-dsh-taffy-theme]   ← host tapIndex 的 pre-paint veil 注入
✓ body[data-dsh-taffy-theme]   ← 客户端 apply() 已执行
✓ 样式表 #dsh-taffy-theme-style 已注入
✓ 装饰节点已挂载 [data-skin-owner] — 15 个
✓ 主题 token 已在 body 上生效 — --ds-taffy-cream=#fff7f1
✓ 状态机已运行 (data-taffy-state) — state=idle
✓ 无未捕获的页面异常
✓ 无主题相关的 console 错误
```

截图确认渲染正常：浅色花房壁纸 + 左右立绘、粉金侧栏（`taffy-harness` 品牌字）、Q 版头像、左下「加油喵」吉祥物、粉金描边输入框。

**意义**：
1. `html` 上的标记来自 host 端 `webServer.tapIndex` → 证明 **host 的 boot veil 注入链路在 0.2.x 上完整可用**（这是之前唯一没能验证的 host 侧断言）；
2. 客户端条目**没有**落进 `did not activate`（DSH 会因此整体拒绝挂载）→ 证明**阶段 A 的失败隔离与阶段 D 的 `ctx.inject(['theme'])` 设计在真实宿主上成立**；
3. 15 个装饰节点 + token 生效 + 状态机运行 → 客户端主题在 0.2.x 上功能完整。

复现：`node browser-accept.mjs <url文件> <截图路径>`（脚本在临时目录，依赖 `playwright-core` + 本机 Edge；**未加入仓库**，避免为一次性验收给项目引入浏览器依赖）。

---

### 3.7.2 【桌面运行时实测】桌面版自带运行时上的安装与素材路由 —— 通过

上面 §3.7 / §3.7.1 全部是在 npm 装出来的 Web profile 上做的。桌面版是另一套运行时，
因此单独用**桌面安装包自带的 CLI**（`E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd`，
pnpm v11.28.5，与 `runtime.json` 一致）在隔离 `DSH_HOME` 下复验：

| 环节 | 结果 |
| --- | --- |
| `dsh plugin add <tgz>` | **`exit 0`**，装上 `@dsh-external/dsh-taffy-theme 0.1.9` |
| `/plugins/<id>/assets/taffy/avatar.webp` | **`200 image/webp`** 123606 B |
| `/plugins/<id>/assets/taffy/wallpaper-light.webp` | **`200 image/webp`** 165906 B |
| `/plugins/<id>/assets/taffy/icons/face-happy.webp` | **`200 image/webp`** 58322 B |
| `/plugins/<id>/assets/taffy/manifest.json` | **`200 application/json`** 1216 B |
| `…/assets/taffy/../package.json`（穿越） | **`404`**，0 B |

并且从 `app.asar` 里读出了桌面外壳的转发实现：`dsh-app://app/` 只把 `/`、`/index.html`、
`/assets/*`、`/favicon.svg`、`/manifest.webmanifest` 当静态文件，**其余全部
`forwardWebRequest` 转发给 Host HTTP 服务并注入鉴权 cookie**，`/plugins/**` 还在
`PLUGIN_BUNDLE_PATH = /^\/plugins\//u` 下被专门设成 `cache-control: no-store`。
桌面版前端取自 `@deepseek-ai/dsh-web-frontend/dist`，与 Web 版是同一份构建产物。

**边界**：这证明的是「安装门 + 素材路由 + 转发路径」在桌面运行时上成立，
**不等于**「已在 Electron 渲染进程内看到主题效果」。后者仍未观测 ——
同账户下第二个 Electron 实例会被单实例锁拦下（`--user-data-dir` 不生效，实测新进程立即退出）。
详见 `docs/DESKTOP-RUNTIME-EVIDENCE.md`。

---

## 4. 复现命令

```powershell
$px='http://127.0.0.1:7897'   # 本机 github/npm 需走代理

# 看真实的新版在哪条 tag 上（latest 是旧的！）
foreach ($p in @('dsh','dsh-client-ui-theme','dsh-client-ui-slots','dsh-host-webserver')) {
  $j = curl.exe -s --proxy $px "https://registry.npmjs.org/@deepseek-ai%2F$p" | ConvertFrom-Json
  "$p  " + (($j.'dist-tags'.PSObject.Properties | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join '  ')
}

# 确认 presets 包改名
foreach ($n in @('dsh-agent-presets','dsh-agent-preset')) {
  $j = curl.exe -s --proxy $px "https://registry.npmjs.org/@deepseek-ai%2F$n" | ConvertFrom-Json
  "$n next=$($j.'dist-tags'.next)"
}

# 取 0.2.1-rc.2 的真实主题 API
$url = (curl.exe -s --proxy $px "https://registry.npmjs.org/@deepseek-ai%2Fdsh-client-ui-theme/0.2.1-rc.2" | ConvertFrom-Json).dist.tarball
curl.exe -sL --proxy $px -o theme.tgz $url; tar -xzf theme.tgz
Get-Content package\lib\types\client\index.d.ts

# 验 DOM 锚点（记得把 sidebar-right 也扫进去）
```
