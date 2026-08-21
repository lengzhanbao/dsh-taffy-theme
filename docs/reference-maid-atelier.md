# maid-atelier 参考研究

证据来源：GitHub `Small-tailqwq/dsh-deep-whale` / `maid-atelier`（只读，未复制代码与资产）。

LICENSE：CC-BY-NC-SA-4.0。

## 目录结构

- `package.json`：`dsh.bundle.patch` + `dsh.client`
- `cordis.patch.yml`：insert `ui-skin-maid-atelier`
- `src/index.ts`：host `apply()` 为空
- `src/client/index.ts`：CSS / DOM / MutationObserver
- `build/tsdown.client.ts`：client bundle
- 图片：生成进 TS 模块（巨大 data URL）

## 强制对照表

| 项目 | maid-atelier 做法 | Taffy 独立实现 | 采用 | 原因 |
|------|-------------------|----------------|------|------|
| 插件入口 | cordis.patch insert + 包名 ID | `dsh-taffy-theme` / `@dsh-external/dsh-taffy-theme` | 是 | 标准 bundle |
| Host/Client | host 空，client 做 UI | host 可选 settings；client 主题与设置 | 是 | 需要 preset + 主题 |
| 图片组织 | 构建内嵌 art TS | `assets/taffy` + 构建时小图 data URL | 部分 | 不依赖 `/plugins/.../assets` 静态路由 |
| CSS 注入 | CSS module 运行时注入 | 单一 `#dsh-taffy-theme-style` | 是 | 可幂等替换 |
| 状态传递 | MutationObserver + data-* | `adapter.ts` + DOM 信号 | 是 | 不绑 React 内部 |
| 设置保存 | 皮肤局部配置 | localStorage `dsh-taffy-theme:v1` | 是 | 第三方 namespace 未进 wire 白名单 |
| dispose | `ctx.effect` 清理 | 同模式 | 是 | 防泄漏 |
| HMR | invalidate 再注册 | 单 style 节点 | 是 | 防重复注入 |
| 构建 | tsdown banner/footer | 同，ID 无 `@file:` 前缀 | 是 | 与 archive-restore 实测一致 |

## 不可直接复制

代码、类名、文案、SVG、Logo、完整 CSS、生成 art 模块。
