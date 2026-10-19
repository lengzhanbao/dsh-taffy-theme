# DSH Desktop 插件加载链路审计（只读）

> 时间：2026-10-19 · 分支 `compat/dsh-0.2.x` · 目标运行时 DSH Desktop `0.2.1-rc.2`
> 性质：**只读**。未启动/关闭桌面实例，未修改源码、配置、锁文件或 Preset。
> 证据分级：**已证实**（本地源码/行号）· **推断**（有间接证据）· **未验证**

---

## 0. 首要结论与一处硬限制

**硬限制（必须先说）**：`@deepseek-ai/dsh-client-ui-slots` 的源码**在本机任何位置都不可读**。已逐个确认：

| 搜索位置 | 结果 |
| --- | --- |
| `E:\Deepseek harness\dsh-taffy-theme\node_modules\@deepseek-ai` | 未找到 |
| `E:\npm-global\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai` | 未找到 |
| `$env:TEMP\dsh-02-accept\node_modules\@deepseek-ai` | 未找到 |
| `E:\DeepSeekHarness\dsh-runtimes` | 未找到 |

它只作为**外部模块**存在于 `dsh-client-ui-renderer` 的 bundle 引用里（`_deepseek_ai_dsh_client_ui_slots`），实际由宿主 loader 在运行时提供 —— 也就是说它打包在 `app.asar` 内。按你的限制，我**不尝试解包**。

**因此第二节里所有关于 Slot 注册 API 与 schema 的结论，凡涉及该包内部的，一律标为「未验证」**，我只报告能从 renderer 与宿主消费侧证实的事实。

---

## 1. Loader 调用链（第一节 A）

### 1.1 客户端 bundle 的格式与装载入口 —— 已证实

`dsh-client-ui-renderer/lib/client.js` 第 1-3 行：

```js
window.__ModuleLoader__.load({
  ...
  factory: (require) => {
```

即：外部客户端 bundle 通过 **`window.__ModuleLoader__.load({ id, factory })`** 注册自己，`factory` 接收 `require` 用于解析外部依赖。

**与 Taffy 对照**：`tsdown.config.ts:36-38` 的 banner/footer 正是：

```js
banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
footer: 'return module.exports; } });',
intro: 'var module = { exports: {}; var exports = module.exports;',
```

→ **格式匹配，已证实兼容。** 且 `lib/client.js` 实测只有一处外部 `require("react")`（`CLIENT_EXTERNALS` 列表把 cordis / locale / renderer / slots 全部 external 化）。

### 1.2 模块解析与外部依赖

- renderer 对 `@deepseek-ai/dsh-client-ui-slots` 的引用形如 `_deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError`（client.js:346）→ **宿主在运行时按模块 id 提供**，不是打包进来。
- **推断**：Taffy 把这些包放进 `dsh.client.inject` 是正确的（声明"我需要宿主先提供这些模块"），与 renderer 的 external 解析方式一致。
- **未验证**：`dsh.client.inject` 里列的名字是否与宿主 loader 的模块 id 完全一致（尤其 `@deepseek-ai/dsh-client-ui-slots` 在 0.2.1-rc.2 是否仍以这个 id 提供）。

### 1.3 生命周期与失败语义 —— 已证实（前几轮已取，此处仅引用）

`dsh-app-boot/lib/index.js`：

- `unmetRequirements(fields, runtimeVersion)`（:279-299）：**`engines.dsh` 存在时单独决定，完全忽略 `peerDependencies`**；否则只检查 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 的 peer。
- `satisfies(...)`（:276-278）用 `semver.satisfies(v, range, { includePrerelease: true })` —— 比 npm 规则宽。
- `evaluatePluginCompatibility(...)`（:311-325）产出 `{ name, version, runtimeVersion, requirements, exempted }`。
- 浏览器端"任一条目未 active 即整体拒绝挂载"的判定在 `dsh-web-frontend/dist` 的 `Ky/Xy` 中（前几轮已取）。

### 1.4 Taffy manifest 与注入声明现状

`package.json`（本轮已收敛为单线 0.2.x）：

```jsonc
"engines": { "dsh": ">=0.2.1-rc.2 <0.3.0" },
"dsh": {
  "bundle": { "patch": ["./cordis.patch.yml", "./presets/taffy.patch.yml"] },
  "client": {
    "inject": [
      "@deepseek-ai/dsh-client-locale",
      "@deepseek-ai/dsh-client-ui-renderer",
      "@deepseek-ai/dsh-client-ui-slots"
    ],
    "platform": "web"
  }
}
```

| 判据 | 判断 |
| --- | --- |
| bundle 格式（`__ModuleLoader__.load` + `id` + `factory`） | **已证实兼容** |
| `engines.dsh` 与桌面门禁一致 | **已证实**（runtime.json = desktopVersion `0.2.1-rc.2`；桌面自带 CLI `--version` 亦为 `0.2.1-rc.2`） |
| `bundle.patch` 为数组、含新增 preset patch | **已证实**（与 dsh-web-app 同构） |
| `client.platform: "web"` 在桌面是否正确 | **未验证** —— 桌面 profile 组合同样加载 `dsh-web-app`，`platform` 字段的实际消费点我**没有找到源码证据** |
| `inject` 三个 id 是否与宿主模块 id 一致 | **未验证**（slots 无源码可查） |

---

## 2. Slot 注册与挂载链（第一节 B）

### 2.1 outlet 的真实结构 —— 已证实

`dsh-client-ui-renderer/lib/client.js:1124`：

```js
"data-slot": slotKey,
```

→ outlet 渲染为带 `data-slot="<key>"` 的元素，`slotKey` 即注册时使用的槽位名。

补充（前几轮在 `dsh-client-ui-settings-general` 侧读取）：outlet 元素带 `style="display:contents"`，list 型 entry **不额外包一层**（renderer :851-869）。

### 2.2 所有权与生命周期约束 —— 已证实（renderer 内）

| 约束 | 证据 |
| --- | --- |
| 渲染无权槽位会抛错 | `client.js:348` — `SlotOwnershipError('slot 'X' is not declared by this entry's children')` |
| 已释放的注册再渲染会抛错 | `client.js:346` — `StaleAuthorizationError('renderSlot('X') from a disposed registration')`，前置 `host.isLive(entry)` |
| `chain` 型槽位必须用专用 API | `client.js:349` — `renderSlotChain` |
| 绑定按 entry 缓存、身份稳定 | `client.js:341-342`（`WeakMap` + `entryKeyOf`）、`:1221` |

→ **推断**：槽位不是自由字符串，而是**由声明方与消费者的 entry 归属关系约束**的。第三方插件向宿主已声明的槽位注册 entry，属于正常路径；渲染宿主槽位则需要该槽位在自身 entry 的 children 声明中。

### 2.3 Taffy 的声明与消费者 —— 已证实的位置

`src/client/settings-panel.ts`：

```
:12   declare module '@deepseek-ai/dsh-client-ui-slots' { ... }   // 本地类型增强
:198  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), ...)
:203  ctx.slots.inject('settings.general.item', () => ctx.slots.register({ ... }))
:207  locale: SETTINGS_NS
```

注册→挂载→消费的三个环节：

| 环节 | 证据 | 判断 |
| --- | --- | --- |
| **注册** | 代码路径存在（`settings-panel.ts:203`），且官方 locale 插件使用**同一写法**（前几轮已比对 `dsh-client-ui-renderer/lib/client.js:1395-1402`，"一字不差"） | **已证实写了**（调用形态正确） |
| **挂载** | outlet 由 renderer 渲染 `data-slot`（`client.js:1124`）；宿主在 `dsh-client-ui-settings-general` 声明 `settings.general.item: { kind:'list', scope:'root' }` | **已证实宿主侧有该槽位** |
| **消费者生效** | 需要在真实运行时看到 entry 真的出现在「设置 → 通用」 | **未验证**（浏览器端 10/10 只证明主题整体生效，未单独断言该行渲染） |

> ⚠️ **`declare module` 存在的含义**：`settings-panel.ts:12` 用了本地类型增强，正是因为 `@deepseek-ai/dsh-client-ui-slots` 在**本地不可解析**。这不代表宿主运行时没有它 —— renderer 明确把它当外部模块引用。但**类型层面的正确性无法由本地编译验证**，这是当前类型检查的一个盲区。

---

## 3. 差异表（第一节 C）

| # | Taffy 当前实现 | 官方桌面运行时要求 | 证据 | 判断 | 需改文件 | 最小修复 | 回归风险 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `__ModuleLoader__.load({id, factory})` | 同 | renderer `client.js:1-3`；Taffy `tsdown.config.ts:36-38` | **已证实兼容** | — | — | — |
| 2 | `engines.dsh = >=0.2.1-rc.2 <0.3.0` | 门禁按 `engines.dsh` 单独判定，`includePrerelease` | `dsh-app-boot/lib/index.js:276-299` | **已证实兼容** | — | — | — |
| 3 | `bundle.patch` 数组含两个 patch | 与 dsh-web-app 同构 | dsh-web-app `package.json` | **已证实兼容** | — | — | — |
| 4 | preset 以 `- insert: [{name:'@deepseek-ai/dsh-agent-preset', config:{id,order,plugins}}]` 声明 | 同（dsh-web-app `presets/*.patch.yml`） | 本仓库 `presets/taffy.patch.yml` + 官方 `entryListProblem` 通过 | **已证实兼容** | — | — | — |
| 5 | `ctx.slots.inject(key, () => ctx.slots.register(def))` | 与官方 locale 插件同形 | Taffy `settings-panel.ts:203`；renderer `:1395-1402` | **已证实形态正确** | — | — | — |
| 6 | `dsh.client.inject` 列 3 个模块 id | id 必须能被宿主 loader 解析 | renderer 把 slots 当外部模块 `:346` | **未验证** | `package.json` → `dsh.client.inject` | 需在桌面运行时确认三个 id 均解析成功；若 slots 无对应 id 则移除该条 | 低（inject 缺失是**静默跳过**，前几轮已证） |
| 7 | `dsh.client.platform: "web"` | 桌面是否仍期望 `"web"` | **未找到消费点源码** | **未验证** | `package.json` → `dsh.client.platform` | 需在桌面确认；若桌面用别的值则改 | 中（若取值错误可能整条客户端不注入） |
| 8 | `settings-panel.ts:12` 本地 `declare module` | — | 该包本地不可解析 | **推断：类型盲区** | `src/client/settings-panel.ts` | 把 slots 装成 devDependency 以获得真实类型，去除本地增强 | 低（仅类型） |
| 9 | DOM 选择器（右栏/工具卡/侧栏/workspace） | 已按 0.2.1-rc.2 发布产物核对 | `x-dsh-client-ui-*` bundle（契约测试已固化） | **已证实对齐**（本轮无新证据推翻） | — | — | — |

### 是否需要修改入口 / manifest / 注入 / Slot / 生命周期

- **入口（`__ModuleLoader__` 形态）**：**不需要**（已证实兼容）
- **manifest（`engines.dsh` / `bundle.patch` / preset）**：**不需要**（本轮已收敛并通过门禁）
- **注入声明（`dsh.client.inject`）**：**可能需要**（#6，未验证）
- **`dsh.client.platform`**：**可能需要**（#7，未验证，且失败后果最重）
- **Slot 配置**：**不需要**（形态已证实）
- **生命周期代码**：**不需要**（前几轮已按 `ctx.effect` 实现并测试）

---

## 4. 桌面资源请求链路（第二阶段）

**本轮未完成** —— 按你的要求，本阶段在第一节之后。现有可陈述的：

| 环节 | 现状 | 证据等级 |
| --- | --- | --- |
| Taffy 素材 URL 前缀 | `/plugins/@dsh-external/dsh-taffy-theme/assets/...` | 已证实（`lib/assets/manifest.js` 的 `PLUGIN_ASSET_ROUTE_PREFIX`） |
| 路由注册方式 | host 端 `webServer.register({kind:'prefix', path, handler})`，经 `ctx.effect` 托管 | 已证实（`src/index.ts`、`ver:pack` 探针） |
| 该路由在 **web profile** 上可用 | 隔离 0.2.1-rc.2 实测 **HTTP 200 / image/webp / 123,606 bytes** | 已证实（但那是 web profile，**不是桌面**） |
| 桌面是否走 `webServer` | **未知** —— `dsh-app://app/` 与 Host 的连接方式未查 | **未验证** |
| 桌面客户端如何发素材请求 | **未知** | **未验证** |

**关键未知**：桌面主文档若是 `dsh-app://app/` 自定义协议，素材请求可能**不经过** `webServer`，导致 `webServer.register` 注册的路由在桌面上形同虚设。这必须靠第二阶段（读 `dsh-host-webserver`）与真实桌面运行才能定论。

---

## 5. 最小文件清单、修复顺序与验收

### 5.1 可能需要的改动（按验证优先级）

| 顺序 | 文件 | 改什么 | 触发条件 |
| --- | --- | --- | --- |
| 1 | `package.json` → `dsh.client.platform` | 若桌面期望非 `"web"` 值则改 | 桌面运行时确认 |
| 2 | `package.json` → `dsh.client.inject` | 校正为宿主真实模块 id | 桌面运行时确认 |
| 3 | `src/client/settings-panel.ts` | 去掉本地 `declare module`，改为依赖真实包 | slots 装为 devDependency 后 |

**不需要改**：入口、manifest、preset、Slot 注册形态、生命周期代码。

### 5.2 回归风险

- 改 `dsh.client.platform` **风险最高**：若取值错误可能导致客户端整体不注入（而 host 半仍正常），表现为"主题完全不生效"。
- 改 `dsh.client.inject` **风险低**：缺失条目是静默跳过（已证实）。
- 去 `declare module` **风险低**，但会让类型检查依赖真实包是否装得上。

### 5.3 验收方法

1. **静态**：`npm run ci` 全绿（当前：peers 8 / preset 15 / assets 57 / static 127 / tests 119 / pack 56）
2. **桌面**：按 `docs/DESKTOP-ISOLATION-RUNBOOK.md` 的 SHA-256 闸门启动隔离实例后，依次验证
   - `__ModuleLoader__` 是否加载了 Taffy 的 `client.js`（DevTools Network / `window.__ModuleLoader__`）
   - `document.querySelectorAll('[data-slot]')` 中是否出现 `settings.general.item` 的 outlet 且含 Taffy entry
   - 素材请求的实际 URL 与响应码（判断是否绕过 `webServer`）

---

## 6. 结论分界

### 已证实
- bundle 装载格式与 Taffy 产物一致（renderer `client.js:1-3` ↔ `tsdown.config.ts:36-38`）
- `engines.dsh` 单线范围与桌面 0.2.1-rc.2 门禁一致（`dsh-app-boot:276-299` + `runtime.json` + 桌面 CLI `--version`）
- `bundle.patch`、preset 声明与官方同构（dsh-web-app 对照 + `entryListProblem` 通过）
- Slot outlet 渲染为 `data-slot="<key>"`（renderer `:1124`）
- Slot 有所有权/失效约束（renderer `:346-349`）
- Taffy 的 slot 注册调用形态与官方 locale 插件一致（`settings-panel.ts:203` ↔ renderer `:1395-1402`）
- `dsh-client-ui-slots` 本机无源码可读（四处搜索均未找到）

### 推断
- `dsh.client.inject` 里列 slots 是正确做法（因 renderer 把它当外部模块）
- 向宿主已声明的槽位注册 entry 是受支持的第三方路径
- `settings-panel.ts:12` 的本地 `declare module` 是类型盲区而非运行期缺陷

### 未验证
- `dsh.client.platform: "web"` 在桌面是否正确
- `inject` 三个 id 在桌面运行时是否全部解析成功
- Taffy 的设置在桌面「设置 → 通用」是否真的渲染出来（注册/挂载/消费三环节中的第三个）
- **桌面素材请求路径**：`webServer.register` 的路由在 `dsh-app://app/` 下是否被使用
- 桌面版安装、加载、渲染、主题切换、设置持久化、卸载清理 —— **全部未做**

> 本报告**不构成桌面兼容结论**。浏览器端此前取得的 10/10 属组件级验证，不作为桌面证据。
