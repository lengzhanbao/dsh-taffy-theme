# 环境基线（Phase 0）

记录时间：2026-08-21（v0.1.1 待发）

| 项目 | 值 |
|------|-----|
| 插件源码 | `E:\DeepSeekHarness\projects\dsh-taffy-theme` |
| 当前版本 | `0.1.1`（本地；GitHub Release 待打 tag） |
| DSH_HOME | `E:\DeepSeekHarness` |
| DSH checkout | `E:\DeepSeekHarness\src\deepseek-harness` |
| Web profile | `E:\DeepSeekHarness\profiles\web` |
| Web 地址 | `http://127.0.0.1:3080` |
| 用户 preset | `E:\DeepSeekHarness\.agent-presets\taffy\` |
| 已发布 tag | `v0.1.0` @ `03032aa` |

## 门禁快照（2026-08-21）

| 命令 | 结果 |
|------|------|
| `npm test` | 70 passed |
| `npm run verify:static` | 71 checks, 0 failures |
| `npm run verify:assets` | 50 checks, 0 failures |
| `npm run verify:pack` | 11 checks, 0 failures |
| `npm run verify -- capture/*.json` | 77 checks, 0 failures |

## 对外安装（普通用户）

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.1.tgz
dsh web
```

详见 [install.zh.md](install.zh.md)。

## 资产 pin

- `assetSetVersion`: `2026-08-left-light-defringe`
- 重生成：`npm run assets:defringe` → `npm run verify:assets`

## 本地开发装到 3080

```powershell
$env:DSH_CHECKOUT = "E:\DeepSeekHarness\src\deepseek-harness"
npm run install:dev
dsh web
```

## 生产式 tarball 冒烟（发版前必跑）

```powershell
npm run install:release
dsh web
```

## 发版

见 [release-checklist.md](release-checklist.md)。

## 实况取证

```powershell
npm run capture:hint
npm run verify -- capture/chat-light.json capture/chat-dark.json
```
