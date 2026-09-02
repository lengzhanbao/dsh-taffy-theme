# Changelog

## 0.1.3 — 2026-09-02

### 视觉 / Hero
- 首页大标题文案改为 **关注塔菲喵！关注塔菲谢谢喵！**（原"探索未至之境预览版"）
- 标题粉金渐变：亮色玫瑰金（#c99a27→#b8860b）、暗色亮粉金（#ffb8d6→#ffd060），深浅主题字色分明、白底可读
- 标题左侧图标换成圆形 **塔菲喵大头照**（金边 + 粉描边）
- 纯 CSS 动态特效（尊重 `prefers-reduced-motion`）：
  - 加载时标题与头像轻轻上浮淡入
  - 头像金粉光晕随浮动呼吸
  - 标题粉金渐变缓动流光 + 周期高光扫过
- 标题加 `-webkit-text-stroke` 描边，亮色白底保底可读（`paint-order: stroke fill` 已在）
- 新增个性化：标题文案与头像图片地址可在「塔菲工房 → 个性化」自定义，留空即恢复默认塔菲

### 修复
- 图片 URL 加载：host 侧注册 `/plugins/@dsh-external/dsh-taffy-theme/assets/` 静态路由（DSH 默认只提供 `client.js`）
- Release tarball 补全 `lib/assets/route.js` / `manifest.js` / `trust-fence.js`
- `verify:pack` tarball 静态检查 + 开发树 host import 探针
- `build.ps1` host 编译失败时立即中止；`typecheck` 使用 `tsconfig.host.json`
- 资产路由增加 loopback Host 校验（非 127.0.0.1/localhost 返回 403）

### 性能
- 接通 `data-taffy-low-power`：减动效 / 低内存设备自动关 blur 与动画
- CSS 注入去重、Q 图标预加载缓存、MutationObserver 过滤、metrics stamp 去重
- 启动 `boot veil` 消除闪白；`saveData` 弱网下自动熔断动效
- 流畅度：hero 动效接入低功耗 / 减动效 / 关闭动效开关；标题阴影合并为单层；observer 文案同步 rAF 合帧；设置面板文本输入防抖 300ms，避免逐键全量重同步

### 工程
- 新增 GitHub Actions：verify / test / pack 门禁（CI）
- Q chrome、融合舞台、更安静的侧栏装饰
- 刷新 GitHub 预览图（浅色/深色粉金 hero：`preview/light-v2.webp`、`preview/dark-v2.webp`，cache-bust）
- 新增构建漂移门禁：`verify:static` 比对产物内联源 CSS 与 `src/theme` 当前内容，改样式未重新 build 即报错（含 5 项检查）

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
