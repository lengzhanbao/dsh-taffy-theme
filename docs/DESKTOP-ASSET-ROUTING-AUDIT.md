# DSH Desktop 资源请求链路审计（第二阶段 · 只读）

> 时间：2026-10-19 · 分支 `compat/dsh-0.2.x`（23 提交）· 目标 DSH Desktop `0.2.1-rc.2`
> 性质：**只读**。未启动/关闭桌面应用，未解包 `app.asar`，未改源码/配置/lockfile/Preset。
> 证据分级：**已证实** · **推断** · **未验证**

---

## 0. 本轮最重要的两个结论

1. **`dsh.client.platform: "web"` 判定为正确** —— 官方客户端插件（**包括官方主题插件本身**）全部声明同一个值，且证据显示它就在 `dsh.client` 块内。**第一轮审计里标为"最高风险、未验证"的这一项，现在可以降级。**
2. **桌面协议层的实现无法在本地证实** —— `dsh-app://app/` 的处理在 `app.asar` 内，按限制不解包。因此"桌面渲染进程的素材请求是否到达 HTTP Server"**仍属未验证**，本节不给结论。

---

## 1. 桌面资源请求链路图

```
┌─ Electron 主进程 (app.asar，不可读) ─────────────────────────────┐
│  注册自定义协议 dsh-app://            ← 未验证                    │
│  启动/连接 DSH Host                                              │
└──────────────────────────────────────────────────────────────────┘
                │
                │ ① 主文档如何取得（dsh-app://app/ ？还是 http://127.0.0.1:port ？）
                ▼                                        ← 未验证
┌─ Renderer ───────────────────────────────────────────────────────┐
│  页面 origin 未知（dsh-app://app 或 http://127.0.0.1:<port>）      │
│  Taffy 注入的 <img src="/plugins/@dsh-external/.../avatar.webp?v=…">│
└──────────────────────────────────────────────────────────────────┘
                │
                │ ② 相对 URL 解析到哪个 origin？          ← 未验证
                ▼
┌─ DSH Host: dsh-host-webserver ───────────────────────────────────┐
│  node:http / node:https createServer          已证实 (:1-9)        │
│  register({kind:'prefix', path}) → 路由表     已证实              │
│  匹配：pathname !== prefix && !startsWith(prefix+'/') → continue   │
│                                               已证实 (:500)        │
│  经 ctx.webServer 由 host 插件注册             已证实（Taffy 侧）    │
└──────────────────────────────────────────────────────────────────┘
                │
                ▼  ③ 返回 webp / image/webp
        （已在 **web profile** 上实测 200/123,606 B；桌面未验）
```

**关键分叉在 ① 与 ②**：桌面主文档若由自定义协议提供，则页面 origin 不是 HTTP Server，相对路径 `/plugins/...` 会解析到 `dsh-app://` 而不是 HTTP Server —— 那样 Taffy 的素材 URL 在桌面上会 404。

---

## 2. Web Server 与桌面协议的关系

| 项 | 结论 | 证据 |
| --- | --- | --- |
| Host 侧确实存在真实 HTTP 服务 | **已证实** | `dsh-host-webserver/lib/index.js:1-9` 导入 `node:http`/`node:https` 的 `createServer` |
| 路由注册形态 | **已证实** | `switch (row.kind)`（`:30`）；前缀匹配 `:500` |
| 桌面 profile 是否组合该服务 | **推断为是** | `profiles/desktop/package.json` 的 bundles 与 web 相同（`dsh-base` + `dsh-web-app`），而 web 组合里 `webServer` 可用（Taffy 的 `inject = ['webServer']` 在 web 上生效） |
| `dsh-app://app/` 是否绕过 Web Server | **未验证** | 协议注册在 `app.asar` 内，不可读 |
| 桌面 Renderer 的 origin | **未验证** | 同上 |
| 是否存在 CSP 限制跨 origin 资源 | **未验证** | 同上；但这是最可能让"图片能显示、字体/CSS 失败"的机制 |

> **不得假设**：无法从源码判定桌面请求是否经过 Web Server。两种可能都存在，且都未被排除。

---

## 3. Taffy 当前 URL 与路由差异表

### 3.1 Taffy 侧实际值（已证实）

```ts
// src/assets/manifest.ts
:16  PLUGIN_ASSET_ROUTE_PREFIX = '/plugins/@dsh-external/dsh-taffy-theme/assets'
:17  PLUGIN_ASSET_BASE         = `${PLUGIN_ASSET_ROUTE_PREFIX}/taffy`
:20  ASSET_SET_VERSION         = '2026-08-25-hero-avatar'
:24  → `${PLUGIN_ASSET_BASE}/${clean}?v=${ASSET_SET_VERSION}`

// src/assets/route.ts
:76  ctx.webServer.register({ kind: 'prefix', path: PLUGIN_ASSET_ROUTE_PREFIX })
```

### 3.2 逐项对照

| # | 项 | Taffy 当前实现 | 桌面端预期 | 证据 | 判断 | 最小修复 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 路由注册形态 | `{ kind:'prefix', path:'/plugins/@dsh-external/dsh-taffy-theme/assets' }` | 同（`switch(row.kind)` + 前缀匹配） | host-webserver `:30`、`:500` | **已证实兼容** | — |
| 2 | URL 前缀与注册前缀一致 | 两者同源常量 `PLUGIN_ASSET_ROUTE_PREFIX` | 必须一致 | `manifest.ts:16` ↔ `route.ts:78` | **已证实一致** | — |
| 3 | 版本化查询串 `?v=` | 有 | 无害 | `manifest.ts:24` | **已证实无害** | — |
| 4 | 相对 URL（无 origin） | `<img src="/plugins/...">` | **取决于页面 origin** | 桌面 origin 不可读 | **未验证** | 若 origin 非 HTTP Server：改用 `webServer` 暴露的绝对 origin，或改为随客户端 bundle 内联/由 loader 提供 |
| 5 | 注册时机 | host `apply()` 内经 `ctx.effect` | host 启动时注册 | `src/index.ts` | **已证实** | — |
| 6 | loopback 信任栅栏 | Host 头非 loopback → 403 | 请求仍发往 HTTP Server，Host 应为 `127.0.0.1:<port>` | `src/assets/trust-fence.ts` | **推断通过** | 若桌面经代理/自定义协议转发，需复核 |
| 7 | `dsh.client.immediately` | **未声明** | 官方客户端插件声明 `immediately: true` | 见 §4 | **未验证是否有影响** | 待确认后再决定是否补 |

---

## 4. `dsh.client.platform` 的证据与结论

### 4.1 定义位置 —— 已证实

官方 `dsh-client-ui-theme` 的 `package.json`：

```json
"dsh": {
  "client": {
    "inject": ["@deepseek-ai/dsh-client-connection", "@deepseek-ai/dsh-client-locale",
               "@deepseek-ai/dsh-client-shortcuts", "@deepseek-ai/dsh-client-ui-renderer",
               "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-api-remotes"],
    "platform": "web",
    "immediately": true
  }
}
```

→ `platform` **确实在 `dsh.client` 块内**。

### 4.2 消费者 —— 未找到

在所有可读的 `@deepseek-ai` 包中搜索 `client.platform`，**未找到读取该字段的代码**。它很可能由 `app.asar` 内的客户端组合器消费。

### 4.3 结论

| 判断 | 依据 |
| --- | --- |
| **Taffy 的 `"platform": "web"` 与官方一致 → 应视为正确** | 五个官方客户端包（含官方主题）全部为 `"web"`：`dsh-client-locale:37`、`dsh-client-ui-renderer:31`、`dsh-client-ui-settings:34`、`dsh-client-ui-settings-general:44`、`dsh-client-ui-theme:40` |

**第一轮把它列为"最高风险、需桌面确认"是过度保守**。既然官方主题插件在桌面版里也用 `"web"`，桌面组合器就不可能要另一个值。

> 但严格说，**消费端源码不可读**，所以"桌面注入逻辑确实读这个字段"仍属**推断**而非证实。按你的要求，不猜测其确切含义。

### 4.4 顺带发现：官方客户端插件多声明了 `immediately: true`

Taffy 未声明该字段。其语义与影响**未验证**（消费端不可读）。**不建议在没有证据前添加。**

---

## 5. 三态清单

### 已证实
- `dsh-host-webserver` 是真实 HTTP 服务（`node:http`/`node:https`，`:1-9`）
- 路由按 `row.kind` 分派（`:30`），前缀匹配为 `pathname === prefix || startsWith(prefix + '/')`（`:500`）
- Taffy 注册 `kind:'prefix'`，路径与 URL 前缀同源（`manifest.ts:16` ↔ `route.ts:78`）
- Taffy 的素材 URL 形如 `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/<file>?v=2026-08-25-hero-avatar`
- 官方 `dsh-client-ui-theme` 的 `dsh.client` 块含 `platform: "web"` 与 `immediately: true`
- 五个官方客户端包的 `platform` 均为 `"web"`

### 推断
- 桌面 profile 组合同样的 `dsh-web-app`，故 `webServer` 在桌面 Host 侧同样可用
- 桌面 Renderer 的素材请求最终仍发往该 HTTP Server（因为 `dsh-web-app` 是同一套前端）
- Taffy 的 loopback 信任栅栏在桌面下仍会通过（Host 头为 `127.0.0.1:<port>`）
- `platform: "web"` 对桌面同样正确

### 未验证（必须靠不可读的桌面实现或真实运行）
- `dsh-app://app/` 的协议注册与 URL 解析
- 桌面主文档的实际 origin
- 相对路径 `/plugins/...` 在桌面 Renderer 中解析到哪个 origin
- 是否存在 CSP / 混合内容限制影响素材
- `immediately: true` 的语义与缺失后果
- **桌面素材请求的真实响应码**（此前 web profile 的 200 不作为桌面证据）

---

## 6. 最小修改方案与回归风险

**结论：本轮没有发现任何"已证实需要修改"的项。**

按证据强度排序的候选（**全部需桌面运行时证据才能定值**）：

| 优先级 | 候选改动 | 触发条件 | 回归风险 |
| --- | --- | --- | --- |
| 1 | 素材 URL 改为绝对 origin 或改由客户端 bundle 承载 | 若桌面 origin 不是 HTTP Server 且相对路径 404 | **中** —— 改错会让 web 路径也失效；需两条路径都验 |
| 2 | 补 `dsh.client.immediately` | 若桌面确认其影响客户端注入时机 | 低-中（未知语义，不宜盲加） |
| 3 | 复核 loopback 信任栅栏 | 若桌面请求经代理转发、Host 头非 loopback | 低 |

**明确不需要改**：路由注册形态、前缀命名、`?v=` 版本串、`platform` 字段、preset、入口格式。

---

## 7. 必须通过真实桌面运行才能确认的问题

1. 桌面 Renderer 发起素材请求的**实际 URL**（含 origin）。
2. 该请求的**响应码与 content-type**。
3. 若失败：是 404（路径没到 HTTP Server）、403（信任栅栏）、还是被 CSP 拦截。
4. `dsh-app://app/` 与 HTTP Server 的并存关系。
5. `immediately: true` 是否影响 Taffy 的注入时机。
6. 设置页面槽位 entry 是否真的渲染（第一轮遗留项）。
7. 停用/卸载/重启后的清理是否彻底。

**验收方法**：在按 `docs/DESKTOP-ISOLATION-RUNBOOK.md` 通过 SHA-256 闸门启动的隔离实例里，用 DevTools 记录 Network 中匹配 `/plugins/@dsh-external/dsh-taffy-theme/` 的请求，与 `document.location.origin` 一并留存。

---

## 8. 与第一轮审计的关系

| 第一轮结论 | 本轮更新 |
| --- | --- |
| `dsh.client.platform: "web"` —— 最高风险、未验证 | **降级为「推断正确」**：官方主题插件同样使用 `"web"`（§4.3） |
| `dsh.client.inject` 三个 id —— 未验证 | 本轮**未推进**（需宿主 loader 的 id 表，不可读） |
| 桌面资源请求路径 —— 未验证 | 本轮定位了分叉点（origin）与判定方法，**仍未证实** |

> ⚠️ 本报告**不构成桌面兼容结论**。web profile 的 HTTP 200、浏览器预览与 Playwright 结果**均不作为桌面素材路由证据**。

---

## 9. 关键更正：Agent 自身就运行在被审计的桌面运行时内

**前两轮审计有一个根本性的视角错误**：我把 `E:\DeepSeekHarness` 当成"用户的生产数据"、把桌面实例当成外部黑盒。实际上——

**本 Agent 就运行在那个桌面实例里。`E:\DeepSeekHarness\profiles\desktop` 就是我自己正在使用的 profile。**

证据（监听 10480 的进程 PID 21036 的完整命令行）：

```
"E:\Deepseek harness\DeepSeek Harness.exe" --expose-internals
  "E:\Deepseek harness\resources\app.asar\dsh\node_modules\@deepseek-ai\dsh-desktop-host\lib\index.js"
  "E:\Deepseek harness\resources\app.asar\dsh"
  E:\DeepSeekHarness\profiles\desktop
  "E:\Deepseek harness\resources\runtime\primary-runtime"
```

→ profile 路径作为 **argv** 传入，就是 `E:\DeepSeekHarness\profiles\desktop`。

### 9.1 由此直接测得的结论（live 桌面运行时，非 web profile）

| 探测 | 结果 | 含义 |
| --- | --- | --- |
| `GET http://127.0.0.1:10480/` | **401** text/plain | 主文档受 token 鉴权 |
| `GET /plugins/@dsh-external/dsh-taffy-theme/assets/taffy/avatar.webp` | **404** | **未鉴权的 `/plugins/` 路径到达了 HTTP 服务器**，仅因未注册而 404 |
| `GET /plugins/` | **404** | 同上 |
| `GET /__nonexistent__` | **404** | 兜底 |
| 监听 10480 的进程 | **PID 21036 = 桌面版自己的 `dsh-desktop-host`** | 界面由**桌面版的 HTTP 服务**提供，不是只走 `dsh-app://` |

**这几条合起来回答了两轮审计里最大的未决问题：**

1. **桌面主文档的 origin 是 `http://127.0.0.1:10480`**（HTTP），不是 `dsh-app://app`；
2. **`/plugins/**` 这类路径由 HTTP 服务器直接处理**（404 而非 401）→ **`webServer.register` 注册的路由在桌面版上可达**；
3. 因此 Taffy 的相对素材 URL `/plugins/@dsh-external/dsh-taffy-theme/assets/...` **会解析到这个 HTTP origin**，与其宿主端路由**前缀一致**（`manifest.ts:16` ↔ `route.ts:78`）。

→ 结论：**素材路由在桌面上应当是有效的**。§7 中列为"必须真实桌面运行才能确认"的首项，现在已有 live 证据支持（仍建议在装好后做一次 200 确认）。

### 9.2 这**不**意味着可以就地安装

`E:\DeepSeekHarness\profiles\desktop` 是**正在使用的实例**（我自己就在其中）。向它安装插件等于修改 live 环境 —— 仍然禁止。

但**测量**是允许的，且已经产生了本轮最有价值的证据。

### 9.3 仍然未验证

- 装上插件后该路径是否真的返回 200 / `image/webp`（需一次实测）
- 设置页槽位 entry 是否渲染
- 主题切换、持久化、卸载清理