# 工程化验收报告

记录时间：2026-08-22

## 当前版本

- **包版本**：`0.1.2`（待发 GitHub Release `v0.1.2`）
- **对外安装**：[install.zh.md](install.zh.md)

## 自动化门禁

| 命令 | 结果 |
|------|------|
| `npm test` | 84 passed |
| `npm run verify:static` | 通过 |
| `npm run verify:assets` | 通过 |
| `npm run verify:pack` | 20 checks, 0 failures |
| `npm run typecheck` | 通过（`tsconfig.host.json`） |

## v0.1.2 变更摘要

- host 静态资源路由 + tarball 补全 + loopback trust fence
- client bundle 改 URL 加载（~176KB，原 base64 ~4MB）
- 性能节流：`chrome-observer`、流式 metrics、低功耗模式
- 发版门禁：`build.ps1` 失败即中止、`verify:pack` 增强

## 3080 实况

- Profile 可通过 `npm run install:release` 安装本地 pack
- 插件 host / client 可加载；更新后需重启 `dsh web`

## 待发

- Git push / tag `v0.1.2` / GitHub Release + `.tgz` 资产
- GitHub 仓库 topic：`dsh-plugin`
- [dsh-market 提交 issue](https://github.com/2BingLing/dsh-market/issues/new?template=submit_plugin.md) 或等待 topic 自动收录
- awesome-dsh-plugin PR（`docs/market/lengzhanbao__dsh-taffy-theme.yml`）

## 刻意延后

- `overrideTokens` 大迁移、DSH 第三皮肤选项
