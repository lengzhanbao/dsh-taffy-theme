# DSH Desktop 兼容审计（第一阶段：只读）

> 审计时间：2026-10-19
> 目标：`E:\Deepseek harness\dsh-taffy-theme` 对 **官方 DSH Desktop** 的兼容性
> 性质：**只读审计**，未修改任何 DSH Desktop 文件，未修改插件代码
> 证据分级：**源码/配置实证** · **运行时实证** · **未验证**

---

## 0. 首要结论

**Taffy 从未在桌面版上验证过，而且大概率装都装不进去** —— 不是因为版本，而是因为**目标 profile 认错了**：

| 项 | 事实 | 证据 |
| --- | --- | --- |
| 桌面版 profile 名 | **`desktop`** | `E:\DeepSeekHarness\profiles\` 下**只有** `desktop`，没有 `web` |
| Taffy 声明 | `"Platform: DSH Web profile only"` | 仓库 `README.md:12` |
| Taffy 的安装文档 | `dsh plugin --profile web add …` | `README.md:20`、`docs/install.zh.md` |

也就是说：Taffy 的所有安装文档与验证，指向的是**浏览器版 profile `web`**；而桌面版跑的是 `desktop` profile。这两者在桌面机器上是**两套并存的环境**（见 §1.3）。

---

## 1. 版本与架构（审计项 1）

### 1.1 桌面安装包

| 项 | 值 | 证据 |
| --- | --- | --- |
| 安装目录 | `E:\Deepseek harness`（即本会话工作目录） | 存在 `DeepSeek Harness.exe` (246 MB)、`resources/app.asar` (182 MB) |
| Electron 应用版本 | `44.7.0` | 安装目录 `version` 文件 |
| **内置 DSH Desktop 版本** | **`0.2.1-rc.2`** | `E:\DeepSeekHarness\dsh-runtimes\dsh-primary-runtime\runtime.json` → `desktopVersion` |
| 平台 / 架构 | `win32` / `x64` | 同上 |
| 运行时 Node | **`24.21.0`** | 同上 |
| 运行时 pnpm | `11.28.5` | 同上 |
| 运行时 Python | `3.12.14`（含 Pillow 12.3.0 等） | 同上 |

**用户本机桌面版版本与任务目标一致（`0.2.1-rc.2`），无需版本差异记录。**

> ⚠️ 注意：桌面运行时 Node 是 **24.21.0**，而本仓库开发机是 **26.3.0**。构建产物与原生依赖需按 24.x 复核（本阶段未做）。

### 1.2 桌面数据目录

`E:\DeepSeekHarness`，布局：

```
attachments/  cache/  dsh-runtimes/  profiles/  sessions/  storages/
.anonymous-user-id  .credentials.yaml
```

- `dsh-runtimes/dsh-primary-runtime/` → `runtime.json` + `dependencies/{node,pnpm,python}`（**只装工具链，不含 DSH 包**）
- `profiles/` → **只有 `desktop`**

### 1.3 关键：桌面与浏览器是两套版本并存

| 环境 | 数据目录 | profile | DSH 版本 |
| --- | --- | --- | --- |
| **桌面版**（本任务目标） | `E:\DeepSeekHarness` | `desktop` | **0.2.1-rc.2** |
| 浏览器版（当前 GUI 10480） | `C:\Users\SYH\.dsh` | `web` | **0.1.6-alpha.1** |

**这解释了此前的困惑**：本会话前面几轮我一直在 `web` profile / `0.1.6-alpha.1` 上验证，而任务目标是 `desktop` / `0.2.1-rc.2`。两者不是同一个宿主。

---

## 2. 桌面 profile 的真实状态（审计项 2）

### 2.1 组合内容

`E:\DeepSeekHarness\profiles\desktop\package.json`：

```json
{
  "name": "dsh-profile-desktop",
  "private": true,
  "dependencies": {},
  "dsh": { "profile": { "bundles": [
    "@deepseek-ai/dsh-base",
    "@deepseek-ai/dsh-web-app"
  ] } }
}
```

**与 `web` profile 的 bundle 列表完全相同** → 桌面版同样加载 `dsh-web-app`（含 webServer 与客户端 UI）。这对 Taffy 是好消息：它依赖的 `webServer.register` / `tapIndex` / `ctx.slots` / `ctx.locale` 应当同样存在（**待第二阶段实证**）。

### 2.2 依赖未安装

| 路径 | 存在 |
| --- | --- |
| `profiles\desktop\node_modules` | ❌ |
| `profiles\node_modules` | ❌ |
| `profiles\desktop\pnpm-lock.yaml` | ❌ |

`dependencies` 为空，且没有 node_modules / lockfile → **桌面 profile 当前没有安装任何外部插件**。

### 2.3 用户自定义层确实被使用

`profiles/desktop/cordis.patch.yml`（7,646 字节）含真实用户配置，例如：

```yaml
- id: agent-default-model
  name: "@deepseek-ai/dsh-agent-default-model"
  config: { provider: opencode-go, model: deepseek-v4.1-flash, reasoningEffort: max }
- id: ui-chat
  name: "@deepseek-ai/dsh-client-ui-chat"
  config: { transcriptView: standard, performanceUsage: compact }
```

→ 说明用户**确实在运行桌面版**，且桌面版读取该 profile 的用户 patch 层。**任何安装测试都必须避开这个文件。**

---

## 3. 对第一阶段 7 个问题的逐项回答

| # | 问题 | 结论 | 证据等级 |
| --- | --- | --- | --- |
| 1 | 桌面安装包版本、内置 Host 与运行时依赖版本 | 见 §1.1。`0.2.1-rc.2` / win32-x64 / Node 24.21.0 | **配置实证** |
| 2 | 桌面插件管理器的安装/启用/升级/卸载流程 | **安装已实证**：用桌面自带 CLI（`resources/runtime/cli/bin/dsh.cmd`，pnpm v11.28.5）在隔离 `DSH_HOME` 下 `plugin add` 返回 `exit 0`。**启用/禁用/卸载/重装仍未验证** | 实测（见 `DESKTOP-RUNTIME-EVIDENCE.md` §1） |
| 3 | `dsh-app://app/` 入口如何与 Host 建立连接 | **未验证**。已确认 `app.asar` 含 `lib/main.js`(516 KB) + 5 个 preload（`preload-app` / `-mandatory` / `-platform-account` / `-update-dialog` / `-welcome`）与 `lib/welcome/`、`renderer/` 资源 | 部分实证 |
| 4 | 外部插件的客户端 bundle 如何被桌面主文档加载 | **已由源码证实**：`protocol.handle("dsh-app")` 只白名单 `/`、`/index.html`、`/assets/*`、`/favicon.svg`、`/manifest.webmanifest`，其余一律 `forwardWebRequest` 给 Host，因此 `/plugins/**` 走转发 + 注入鉴权 cookie；且桌面前端取自 `@deepseek-ai/dsh-web-frontend/dist`，与 Web 版同一份构建产物。**渲染进程内实际执行仍未观测** | 源码实证（见 `DESKTOP-RUNTIME-EVIDENCE.md` §3） |
| 5 | `webServer.tapIndex` / `register` / 客户端注入 / 素材路由在桌面版的调用路径 | **注册侧已实证**：隔离运行时上 `/plugins/<id>/assets/taffy/*.webp` → `200 image/webp`（字节数完整），`manifest.json` → `200`，路径穿越 → `404`。转发侧见第 4 项 | 实测（见 `DESKTOP-RUNTIME-EVIDENCE.md` §2） |
| 6 | `ctx.theme` 在桌面运行时是否存在 | **未验证**。`0.2.1-rc.2` 的 `dsh-client-ui-theme` 提供该服务（前几轮已在 npm 包上验证），但桌面运行时是否 compose 尚未确认。Taffy 已按 `ctx.inject(['theme'], …)` 降级处理，缺该服务时退化为不订阅，不抛错 | 未验证 |
| 7 | `dsh-agent-preset` 的 Preset 格式与加载方式 | **已在 0.2.1-rc.2 上实证**（前几轮）：格式为 `- insert: [{ id: preset-<id>, name: '@deepseek-ai/dsh-agent-preset', config: { id, order, plugins } }]`；Taffy 的 16 行组成通过官方 `entryListProblem`，且实测能组合进 0.2.1-rc.2 组合树（1233→1762 行）。**但未在 desktop profile 上试过** | 运行时实证（web-app profile） |

### 重点问题的直接回答

> **当前 Taffy 的每个启动环节，在官方桌面版里究竟会不会执行？**

**本阶段（只读）时无法回答。后续已补齐到「源码 + 运行时」两级，但渲染进程内的执行仍未观测。** 更新后的状态：

- ✅ 桌面版是 `0.2.1-rc.2`，Taffy 声明的 `engines.dsh`（`>=0.2.1-rc.2 <0.3.0`）**覆盖它** → 安装门禁不会拦；
  并已用桌面自带运行时实测 `plugin add` 成功（`exit 0`）。
- ✅ 桌面 profile 与 web profile 使用**同一组 bundle**，且桌面前端与 Web 版是**同一份**
  `dsh-web-frontend/dist` 构建产物。
- ✅ `webServer.register` 注册的素材路由在桌面运行时上实测 `200 image/webp`，字节完整，穿越被挡。
- ✅ 桌面外壳对 `/plugins/**` 有专门的转发与缓存头处理（`PLUGIN_BUNDLE_PATH = /^\/plugins\//u`），
  说明这条路径是被预期使用的。
- ❌ 但 Taffy 仍未在 `desktop` profile / Electron 渲染进程里跑起来过：`apply()` 的实际执行、
  `tapIndex` 注入后的页面外观、slot 条目渲染、明暗切换与持久化，**一次都没有在渲染进程内观测**。
  原因见 `DESKTOP-RUNTIME-EVIDENCE.md` §4（同账户下第二个 Electron 实例被单实例锁拦下）。

按任务要求，**不得用浏览器测试代替桌面验证** —— 上一轮在 `web` profile 上取得的浏览器 10/10 通过，
**不能**作为桌面兼容证据；本文更新后的实测与源码结论，同样**不等于**渲染进程内验证通过。

---

## 4. 尚未验证（必须在第二阶段/第三阶段补）

1. 桌面插件管理器在 `desktop` profile 下的真实安装/启用/升级/卸载流程。
2. `dsh-app://app/` 与 Host 的连接方式，以及外部插件 client bundle 的加载路径。
3. `webServer.tapIndex` / `register` / 素材路由在桌面版的真实调用。
4. `ctx.theme` 在桌面运行时是否存在及其生命周期。
5. 桌面运行时 Node **24.21.0**（非开发机 26.3.0）下的构建与原生依赖表现。
6. 是否可以在**不触碰** `profiles/desktop/cordis.patch.yml` 与用户配置的前提下做安装测试。

---

## 5. 建议的第二阶段起点

1. **先确认安装路径**：桌面版应用内是否有「插件管理」界面（`dsh-client-ui-plugin-manager` 存在于 0.2.1-rc.2），优先走**官方 UI 流程**，而非手改 profile。
2. **隔离测试**：把 `E:\DeepSeekHarness` **整体复制**到临时目录，用桌面版指向副本（或按官方支持的方式切换数据目录）后测试，**绝不在原目录试装**。
3. **迁移 profile 目标**：Taffy 的安装文档与 `README` 需从 `--profile web` 改为按环境说明（web / desktop）。
4. `engines.dsh` 目前声明了两条线（`>=0.1.6-alpha.1 <0.2.0 || >=0.2.1-rc.2 <0.3.0`）。桌面版只落在第二条，这一条**需要针对 desktop 实际复核**。

---

## 6. 本阶段未做的事（合规声明）

- 未修改 DSH Desktop 的 Electron 主进程、preload 或安装程序；
- 未修改 `E:\DeepSeekHarness` 下任何文件；
- 未在 `desktop` profile 安装/卸载任何插件；
- 未运行桌面应用。

---

## 7. 追加调查（第二轮）：桌面版自带 CLI，第三阶段可无 GUI 完成

### 7.1 找到桌面版自己的 `dsh` CLI

| 事实 | 证据 |
| --- | --- |
| 桌面版自带 CLI | `E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd` |
| 另有运行时 bin | `resources\runtime\bin\node.cmd`、`resources\runtime\cli\command-manager.js`（22.5 KB） |
| CLI 报告版本 | `dsh --version` → **`0.2.1-rc.2`**，exit 0 |
| **尊重 `DSH_HOME`** | 把 `DSH_HOME` 指向临时目录后运行，未写入 `E:\DeepSeekHarness` |

### 7.2 但 desktop profile 必须由桌面应用初始化

用该 CLI 直接安装会失败：

```
dsh: Error: Open DeepSeek Harness Desktop once to initialize its profile,
     then fully quit it before running dsh plugin --profile desktop.
```

这解释了 §2.2 的疑问 —— `profiles/desktop` 里没有 `node_modules` / lockfile，是因为**它不是给 CLI 从零创建的**，必须由应用本体初始化一次。

### 7.3 因此第三阶段的正确流程

1. `DSH_HOME` 指向隔离副本目录，**启动一次 `DeepSeek Harness.exe`** 让它初始化 profile；
2. **完全退出**桌面应用；
3. 用 `resources/runtime/cli/bin/dsh.cmd` + 同一 `DSH_HOME` 执行安装 / 启用 / 停用 / 卸载；
4. 再次启动桌面应用，观察主题实际渲染（浅色、深色、reduced-motion、不同窗口宽度与缩放）。

**第 1 步会弹出 GUI 窗口**，需用户同意；其余步骤可完全脚本化。

### 7.4 走不通的路（记录以免重复踩坑）

- ❌ **直接解析 `app.asar` 头部**：本次尝试 3 次均失败。头部 pickle 的长度字段取值有误，`JSON.parse` 抛错时把整个缓冲区打进了 stdout，两次刷掉大量输出。**不要再用 stdout 承载这类解析结果**，且不要复用失败解析得出的偏移量（第 3 次就是复用了前一阶段的坏偏移，导致 `main.js` 区域读出来全是 0 命中）。
- ❌ **指望 Host 包在 `app.asar.unpacked` 里**：`resources/app.asar.unpacked/dsh/node_modules/@deepseek-ai` 只有 **3 个** 原生扩展包，DSH Host 确实打包在 asar 内部。
- ✅ **正确方向**：不要自己解 asar，**用桌面版自带的 CLI**。

### 7.5 仍未验证

桌面应用本体在真实窗口中的渲染、主题切换、设置持久化、卸载回归 —— 都需要 §7.3 的第 1、4 步，尚未执行。
### 7.6 结论文证：CLI 无法绕过 GUI 创建 desktop profile

在**空的隔离 `DSH_HOME`** 上直接跑：

```
$ dsh --profile desktop --dump-config
error: profile "desktop" is managed exclusively by the Electron application
```

对照：`--profile web --dump-config` 会**自动从内置模板创建** `profiles/web`（本会话前面已实测）。

**结论**：`desktop` profile **由 Electron 应用独占管理**，CLI 既不能创建也不能在未初始化时管理它。因此 §7.3 的第 1 步（启动一次桌面应用）**没有任何命令行替代方案** —— 这是硬约束，不是我的操作问题。

即第三阶段的完整前置条件是：**必须先由桌面应用本体初始化一次 profile**。