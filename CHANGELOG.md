# Changelog

## Unreleased

### 视觉 / Hero
- 首页大标题文案改为 **关注塔菲喵！关注塔菲谢谢喵！**（原"探索未至之境预览版"）
- 标题粉金渐变：亮色玫瑰金（#c99a27→#b8860b）、暗色亮粉金（#ffb8d6→#ffd060），深浅主题字色分明、白底可读
- 标题左侧图标换成圆形 **塔菲喵大头照**（金边 + 粉描边）
- 纯 CSS 动态特效（尊重 `prefers-reduced-motion`）：
  - 加载时标题与头像轻轻上浮淡入
  - 头像金粉光晕随浮动呼吸
  - 标题粉金渐变缓动流光 + 周期高光扫过

### 性能
- CSS 注入去重、Q 图标预加载缓存、MutationObserver 过滤、metrics stamp 去重
- 启动 `boot veil` 消除闪白；`saveData` 弱网下自动熔断动效

### 工程
- 新增 GitHub Actions：verify / test / pack 门禁（CI）
- Q chrome、融合舞台、更安静的侧栏装饰
- 刷新 GitHub 预览图（浅色/深色粉金 hero：`preview/light-v2.webp`、`preview/dark-v2.webp`，cache-bust）

---
## 0.1.2 — 2026-08-21

### 修复

- 图片 URL 加载：host 侧注册 `/plugins/@dsh-external/dsh-taffy-theme/assets/` 静态路由（DSH 默认只提供 `client.js`）
- Release tarball 补全 `lib/assets/route.js` / `manifest.js` / `trust-fence.js`
- `verify:pack` tarball 静态检查 + 开发树 host import 探针
- `build.ps1` host 编译失败时立即中止；`typecheck` 使用 `tsconfig.host.json`
- 资产路由增加 loopback Host 校验（非 127.0.0.1/localhost 返回 403）

### 性能

- 接通 `data-taffy-low-power`：减动效 / 低内存设备自动关 blur 与动画
- `chrome-observer` / `projected-state` / `sidebar-metrics` / `state-view` 合并到 rAF + 最小间隔
- 流式对话时 `conversation-metrics` 降频（120ms）并节流 metrics stamp

### 说明

- 更新插件后需**重启** `dsh web`（host 路由不会 HMR 热更新）

---

## 0.1.1 — 2026-08-21

### 修复

- Release 包补全 `lib/config.js`，避免 host 加载失败
- `schemastery` 写入 `dependencies`，pnpm / tarball 安装可解析 Cordis schema
- `install-dev` 改用 `pnpm add link:`，禁止手改 profile `package.json`（防 UTF-8 BOM 导致 DSH 无法启动）
- 深浅色对话字色：浅色更深墨、深色金粉白；修复 `applyThemeTokens` 把浅色字钉死在 body 导致暗色变黑字的问题
- 对话正文增加轻量字光晕，提升壁纸上的可读性

### 新增

- `verify:pack`：发版前检查 tarball 内容与 host 可加载性
- `install:release`：本地 pack → profile 冒烟安装脚本
- 对外安装说明：[docs/install.zh.md](docs/install.zh.md) / [docs/install.en.md](docs/install.en.md)

### 工程

- 测试 70 项；静态 / 资产 / pack / capture 门禁全绿

---

## 0.1.0 — 2026-08-20

- 首次公开发布：粉金亚克力 Web 主题、深浅色舞台立绘、Taffy Agent 预设
- 工程化门禁 P1–P5、left-light 去黑边资产
