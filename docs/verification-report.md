# 工程化验收报告

记录时间：2026-08-21

## 当前版本

- **包版本**：`0.1.1`（待发 GitHub Release）
- **对外安装**：[install.zh.md](install.zh.md)

## 自动化门禁

| 命令 | 结果 |
|------|------|
| `npm test` | 70 passed |
| `npm run verify:static` | 71 checks, 0 failures |
| `npm run verify:assets` | 50 checks, 0 failures |
| `npm run verify:pack` | 11 checks, 0 failures |
| `npm run verify -- capture/chat-light.json capture/chat-dark.json` | 77 checks, 0 failures |

## v0.1.1 变更摘要

- 对外安装文档（中/英）、CHANGELOG、发版清单
- 对话字色与字光晕可读性修复
- `applyThemeTokens` 不再把浅色字钉死在暗色主题
- pack / install 稳定性（延续 0.1.0 晚修复）

## 3080 实况

- Profile 通过 `npm run install:release` 安装本地 pack
- 插件 host 端可加载

## 待发

- Git commit / tag `v0.1.1` / GitHub Release（用户验收后）
- awesome-dsh-plugin PR

## 刻意延后

- `overrideTokens` 大迁移、DSH 第三皮肤选项
