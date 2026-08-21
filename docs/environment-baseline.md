# 环境基线（Phase 0）

记录时间：2026-08-20

| 项目 | 值 |
|------|-----|
| 设计文档工作区 | `E:\taffy` |
| 插件源码 | `E:\DeepSeekHarness\projects\dsh-taffy-theme` |
| DSH 安装 | `E:\npm-global\node_modules\@deepseek-ai\dsh` |
| DSH 源码 checkout | `E:\DeepSeekHarness\src\deepseek-harness` |
| DSH_HOME | `E:\DeepSeekHarness` |
| Web | `http://127.0.0.1:3080` |
| Profile | `E:\DeepSeekHarness\profiles\web` |
| 塔菲图片源 | `E:\塔菲image` |
| super-injector registry | `[]`（保持空，避免双重装配） |

## 现有装配

- `@dsh-external/dsh-archive-restore`：profile bundle，必须保留
- `@dsh-external/dsh-super-injector`：在 bundles 中，registry 为空
- `dsh-dream-skin`：可能与 Taffy 主题视觉叠加，可在设置中关闭其一

## HMR

未默认承诺 HMR。改 client 后必须重建 `lib/client.js` 并刷新 3080。
