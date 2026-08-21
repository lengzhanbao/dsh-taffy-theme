# Changelog

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
