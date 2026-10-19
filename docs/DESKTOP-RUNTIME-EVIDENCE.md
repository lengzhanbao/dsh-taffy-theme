# DSH Desktop 运行时证据链

审计日期：2026-10-19
对象：`E:\Deepseek harness`（DeepSeek Harness Desktop，`version` = 44.7.0）
运行时：`runtime.json` → `desktopVersion 0.2.1-rc.2`，win32/x64，Node 24.21.0，pnpm 11.28.5
插件：`@dsh-external/dsh-taffy-theme@0.1.9`，分支 `compat/dsh-0.2.x`

本文只记录**实测**与**源码可证**的内容。凡是没有直接观测到的，一律列在最后一节「仍未验证」。

---

## 0. 结论分级

| # | 主张 | 级别 | 依据 |
| --- | --- | --- | --- |
| 1 | 桌面版自带的运行时接受本插件的安装 | **已验证（实测）** | §1，`exit 0` |
| 2 | 桌面版 Host HTTP 服务能正确伺服插件素材路由 | **已验证（实测）** | §2，`200 image/webp` |
| 3 | 桌面渲染进程会把 `/plugins/**` 转发给 Host 并附带鉴权 | **已验证（源码）** | §3，`forwardWebRequest` |
| 4 | 桌面版前端与 Web 版是同一个 `dsh-web-frontend` 构建产物 | **已验证（源码）** | §3.2 |
| 5 | 插件的 client bundle 在 Electron 渲染进程内实际执行并渲染 UI | **未验证** | §5 |

因此：**可以**说「已满足桌面版的安装门与素材路由，且桌面版的转发路径在源码上覆盖插件路由」；
**不可以**说「已在 DSH Desktop 中完整验证主题效果」。后者缺 §5 那一步。

---

## 1. 安装门：桌面版自带运行时接受本插件

用桌面版**自己的** CLI 与运行时，避免任何 Electron 参与：

```powershell
$cli = 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd'
$env:DSH_HOME = "$env:TEMP\dsh-desktop-rt"      # 隔离，不碰真实 profile
& $cli --profile web --dump-config              # 建出 profile
& $cli plugin --profile web add <tarball>       # 安装
```

结果：

```
+ @dsh-external/dsh-taffy-theme 0.1.9
Done in ~Xs using pnpm v11.28.5                 # exit 0
```

`pnpm v11.28.5` 正是 `runtime.json` 里桌面版自带的 pnpm 版本 —— 这条命令走的是桌面版的运行时，不是系统 Node。

**意义**：`dsh-app-boot` 的 0.2.x 安装门（`lib/index.js:279-299`）在这里没有拒绝。0.1.x 时代那条
`requirements {"@deepseek-ai/dsh-agent-presets":">=0.1.6-alpha.1 <0.2.0"}` 的报错不再出现，
因为 `package.json` 现在自己声明了 `engines.dsh: ">=0.2.1-rc.2 <0.3.0"`，按 0.2.x 的门逻辑，
自带 `engines.dsh` 时单独裁决、`peerDependencies` 完全不参与。

> 注意：这里用的是 `--profile web`。桌面 profile 由 Electron 独占管理
> （`dsh --profile desktop` 会报 `profile "desktop" is managed exclusively by the Electron application`）。
> 但两者加载的 bundle 相同：`@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app`。
> 所以「同一条解析与装载代码路径」这个前提成立，见 §3.2。

---

## 2. Host HTTP 服务上的插件素材路由：实测 200

把 §1 的隔离 profile 启动起来，然后直接打插件路由：

```
dsh web: http://127.0.0.1:3080/?token=<redacted>
```

| 请求 | 状态 | Content-Type | 字节数 |
| --- | --- | --- | --- |
| `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/avatar.webp` | **200** | `image/webp` | 123606 |
| `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/wallpaper-light.webp` | **200** | `image/webp` | 165906 |
| `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/icons/face-happy.webp` | **200** | `image/webp` | 58322 |
| `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/manifest.json` | **200** | `application/json` | 1216 |
| `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/../package.json` | **404** | — | 0 |

**意义**：

- `webServer.register` 注册的素材路由在桌面运行时上真的通了，Content-Type 正确，字节数是完整文件大小
  （不是截断、不是空壳）。这是此前只在 Web profile 上验证过的同一件事，现在在桌面运行时上复现。
- 路径穿越被挡（`404`，0 字节），说明路由做了规范化，不是裸 `readFile`。
- 服务端 stderr 为空，没有装载期异常。

**端口不是固定的**：桌面版活实例在 `127.0.0.1:10480`，本节隔离实例在 `:3080`。端口由进程动态分配，
插件路由不依赖具体端口 —— §3 的转发机制也印证了这点（`hostUrl` 是运行时变量）。

---

## 3. 源码级：桌面渲染进程如何加载插件

`resources/app.asar` 里 `@deepseek-ai/dsh-desktop-host` 的实现（字节扫描提取，未解包）。

### 3.1 自定义协议与转发

```js
protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,                    // "dsh-app"
  privileges: { standard: true, secure: true, supportFetchAPI: true,
                corsEnabled: true, stream: true, codeCache: true }
}]);

const applicationUrl = `${SCHEME}://app/`;

protocol.handle(SCHEME, (request) => {
  const url = new URL(request.url);
  if (url.hostname === "shell") return serveWebDocument(request, join(app.getAppPath(), "renderer"));
  if (url.hostname === "app") {
    if (url.pathname === "/" || url.pathname === "/index.html" ||
        url.pathname.startsWith("/assets/") ||
        ["/favicon.svg", "/manifest.webmanifest"].includes(url.pathname))
      return serveWebDocument(request, join(resources.dsh, "node_modules",
        "@deepseek-ai", "dsh-web-frontend", "dist"));
    if (backend.host === void 0 || hostUrl === void 0 || hostCookie === void 0)
      return Promise.resolve(new Response(null, { status: 503 }));
    return forwardWebRequest(request, hostUrl, hostCookie);
  }
  return Promise.resolve(new Response(null, { status: 404 }));
});
```

关键在**白名单是静态文件那几条**，其余一律落到 `forwardWebRequest`。
插件的 `/plugins/<id>/client.js` 和 `/plugins/<id>/assets/**` 都不在白名单里，
所以**会被转发给 Host HTTP 服务**——也就是 §2 里实测返回 200 的那个服务。

### 3.2 前端产物同一份

白名单指向 `resources.dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist`。
Web 版走的是同一个包。也就是说桌面版的页面外壳不是另写的，而是同一份前端构建产物，
`serveWebDocument` 只是往 `index.html` 的 `<head>` 里注入 `globalThis.__DSH_BOOT_READY__`：

```js
const content = pathname === "/" || pathname === "/index.html"
  ? body.toString().replace("<head>",
      "<head><script>globalThis.__DSH_BOOT_READY__ = Promise.withResolvers()<\/script>")
  : new Uint8Array(body);
```

对插件的意义：`@deepseek-ai/dsh-client-ui-renderer` 的 slot 机制、`dsh-client-ui-settings` 的
设置项机制，在桌面版里跑的是**同一份代码**。Web 版上验证过的 slot 行为不会因为换成桌面版而变形。

### 3.3 转发细节：鉴权、同源、插件优先

```js
async function forwardWebRequest(request, host, cookie) {
  const source = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== "dsh-app://app")
    return new Response(null, { status: 403 });          // 同源约束
  const target = new URL(host);
  target.pathname = source.pathname;                     // 路径原样保留
  target.search = source.search;                         // query 原样保留
  const headers = new Headers(request.headers);
  for (const name of ["host","origin","cookie","sec-fetch-site"]) headers.delete(name);
  headers.set("cookie", cookie);                         // 注入 Host 鉴权 cookie
  const init = { method: request.method, headers, body: request.body,
                 signal: request.signal, duplex: "half", redirect: "manual" };
  const response = await fetch(target, init);
  const outgoing = new Headers(response.headers);
  for (const name of WITHHELD_RESPONSE_HEADERS) outgoing.delete(name);
  if (PLUGIN_BUNDLE_PATH.test(source.pathname)) outgoing.set("cache-control", "no-store");
  return new Response(response.body, { status: response.status, headers: outgoing });
}
```

对插件有利的三点：

1. **鉴权由外壳承担**。渲染进程不需要自己带 token，`hostCookie` 由
   `authenticateWebHost(url)` 用启动 URL 换来的 `set-cookie` 提供。
   插件素材请求会自动带上鉴权，不需要在素材 URL 里拼 token。
2. **路径与 query 原样透传**。`webServer.register` 注册什么路径，渲染进程就能请求什么路径。
3. **插件 bundle 是一等公民**：

```js
/** Host routes whose responses carry immutable cache headers keyed by a per-process revision. */
const PLUGIN_BUNDLE_PATH = /^\/plugins\//u;
```

注释原文：*"Plugin bundle responses lose their `cache-control` for `no-store`: the Host marks them
immutable under a revision that changes every launch, so Chromium's disk cache would only accumulate
bundles no later launch can reuse."*
即桌面版**专门**为 `/plugins/**` 处理了缓存头，说明这条路径是被预期使用的。

`WITHHELD_RESPONSE_HEADERS` = `set-cookie, content-encoding, content-length, transfer-encoding,
connection, keep-alive, te, trailer, upgrade, proxy-authenticate, proxy-authorization`。
**`content-security-policy` 不在其中**，Host 的 CSP 原样透传给渲染进程。

### 3.4 渲染进程沙箱

```js
{ nodeIntegration: false, contextIsolation: true, sandbox: true,
  webSecurity: true, webviewTag: false, devTools: true, spellcheck: false }
```

`webSecurity: true` 是插件必须遵守同源约束的原因，但 §3.3 的转发发生在**外壳侧的 Node `fetch`**，
不在渲染进程的 fetch 里，所以浏览器同源策略不阻断插件素材加载。

---

### 3.5 素材 URL 形式与信任栅栏：在桌面版下天然成立

本插件的素材 URL 由 `src/assets/manifest.ts` 生成：

```ts
export const PLUGIN_ASSET_ROUTE_PREFIX = '/plugins/@dsh-external/dsh-taffy-theme/assets'
export function buildAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '')
  return `${PLUGIN_ASSET_BASE}/${clean}?v=${ASSET_SET_VERSION}`
}
```

三点正好对上桌面版：

1. **根相对路径**。在 `dsh-app://app` 下 `/plugins/...` 解析为 `dsh-app://app/plugins/...`，
   不属于静态白名单 → 落进 `forwardWebRequest`，而不是被当成静态文件 404。
2. **`?v=` 查询串保留**。`forwardWebRequest` 里 `target.search = source.search`，
   所以缓存版本参数不会在转发时丢掉。
3. 该 URL 与 §2 实测返回 `200 image/webp` 的那条完全相同。

另有一处本插件自己的栅栏 `src/assets/trust-fence.ts`，只放行回环 `Host`：

```ts
export function isTrustedLocalRequest(headers: IncomingHttpHeaders): boolean {
  const host = header(headers, 'host')
  if (!host) return false
  const hostUrl = parseAuthority(host)
  if (!hostUrl) return false
  return isLoopbackHostname(hostUrl.hostname)
}
```

这本来是桌面版的风险点（渲染进程的 origin 是 `dsh-app://app`，不是回环地址）。
但 `forwardWebRequest` 在转发前把 `host` 头删掉了：

```js
for (const name of ["host", "origin", "cookie", "sec-fetch-site"]) headers.delete(name);
```

`Host` 改由 Node `fetch` 依据目标 `hostUrl`（`http://127.0.0.1:<port>`）重新推导，
所以到达插件路由的请求必然带回环 `Host`，**信任栅栏天然通过**，无需为桌面版放宽。

---

## 4. 为什么不能起第二个 Electron 实例做端到端

实测尝试：

```powershell
Start-Process 'E:\Deepseek harness\DeepSeek Harness.exe' `
  -ArgumentList "--user-data-dir=$env:TEMP\dsh-elec-ud","--remote-debugging-port=9333"
```

结果：新进程 PID 47920 **立即退出**，`DeepSeek Harness.exe` 进程数前后都是 7，
`127.0.0.1:9333` 连接被拒。

结合 asar 里 `requestSingleInstanceLock` ×1、`second-instance` ×1、`app.getPath("userData")`、
`setPath` ×17，以及 `--user-data-dir` 在 asar 中 **0 次**出现：
桌面版用自己算出来的 userData 路径加单实例锁，命令行覆盖不生效，第二个实例会把手上的请求转给已有实例后退出。

**后果**：在同一个 Windows 账户下，无法在不动真实 profile 的前提下，把 Electron 渲染进程跑起来做实测。
`E:\DeepSeekHarness\profiles\desktop` 是当前活实例（PID 21036）正在用的 profile，
只可读、不可写入安装 —— 往里面装插件等于改动用户正在使用的环境。

---

## 5. 仍未验证

| 项 | 为什么没验 | 怎么才能验 |
| --- | --- | --- |
| Taffy 的 client bundle 在 `dsh-app://app` 渲染进程内执行 | §4，单实例锁 | `docs/DESKTOP-ACCEPTANCE-RUNBOOK.md` 步骤 4–5 |
| `settings.general.item` 槽位在桌面上真的渲染出条目 | 同上 | runbook 第 6 步第 6 项 + 探针的 `settings general rows` |
| 明暗切换、设置持久化、壁纸与立绘、右栏/工具卡/composer、窗口缩放 | 同上 | 探针 `light` / `dark` 两次快照 + runbook 第 6 步人工清单 |
| 启用/禁用/卸载/重装、重启后残留 DOM 与监听器 | 同上 | runbook 第 7 步 + 探针 `residual` 快照 |
| 桌面版 CSP 是否对 `dsh-app://app` 下的内联样式或 blob 有额外限制 | 未实测渲染进程 | 同上；一旦挂载成功即反证无阻断 |

上述任何一项在实测前，都**不得**对外声明「已验证兼容 DSH Desktop」。

### 5.1 探针本身已自测

交给执行者的探针 `scripts/desktop-accept.mjs` 不是没跑过的代码。它已在
**真实 0.2.1-rc.2 隔离实例 + 真实 Chromium（Edge 155 headless，CDP）** 上跑通一次，
8/8 全绿、`exit 0`：

```
✓ body 带 taffy 标记        ✓ 样式节点已注入（109802 B）
✓ 装饰节点已挂载            ✓ 立绘已挂载
✓ 状态机在跑                ✓ 素材无加载错误
✓ 立绘已解码                ✓ 主题 token 生效
  skin-owned / chrome   15 / 6      characters / mascots  2 / 1
  --ds-taffy-cream      #211b32     localStorage  dsh-taffy-theme:v1
  image left   977x1019   /plugins/@dsh-external/dsh-taffy-theme/assets/taffy/left-dark.webp?v=…
  image right  968x960    …/right-dark.webp?v=…
  image sidebar 1021x966  …/avatar-night.webp?v=…
```

三点值得单独记下：

1. **图片 URL 与解码尺寸同时拿到** —— 说明素材不仅路由返回 200，而且被浏览器**成功解码**，
   不是坏文件、不是占位符。
2. **`localStorage` 里出现 `dsh-taffy-theme:v1`** —— 设置持久化的存储键确认。
3. 该实例是深色态，取到的是 `left-dark` / `right-dark` / `avatar-night`，
   说明按明暗选素材的分支也在工作。

探针目标前缀由 `DSH_DESKTOP_TARGET_PREFIX` 控制，**默认 `dsh-app://app`**；
自测时才临时指向 `http://127.0.0.1`。验收时不要改这个变量，否则可能量到错误页面。


---

## 6. 复现

```powershell
# 1) 打包
cd 'E:\Deepseek harness\dsh-taffy-theme'
npm run build:ci; npm pack

# 2) 隔离安装（用桌面版自带运行时）
$cli = 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd'
$env:DSH_HOME = "$env:TEMP\dsh-desktop-rt"
& $cli --profile web --dump-config
& $cli plugin --profile web add .\dsh-external-dsh-taffy-theme-0.1.9.tgz

# 3) 起服务并打插件路由
Start-Process -FilePath $cli -ArgumentList '--profile','web','--no-open' -NoNewWindow
curl.exe -s -o NUL -w '%{http_code} %{content_type} %{size_download}' `
  'http://127.0.0.1:3080/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/avatar.webp'
# 期望：200 image/webp 123606
```

`$env:TEMP\dsh-desktop-rt` 是隔离的 `DSH_HOME`，与 `E:\DeepSeekHarness\profiles\desktop` 无关，
可随时整个删掉。
