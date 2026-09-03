# 工程化回退指南

## 按阶段回退

| 阶段 | 回退方式 |
|------|----------|
| P1 静态门禁 | 删除 `scripts/verify-taffy.mjs`、`verify/`，从 `package.json` 去掉 `verify:*` / `prepublishOnly` |
| P2 资产门控 | 删除 `scripts/verify-assets.mjs`、`scripts/asset-metrics.py`、`assets/taffy/baseline.json`；去掉 `prebuild` |
| P3 选择器收敛 | `git checkout -- src/client/chrome-selectors.ts projected-state.ts sidebar-metrics.ts` |
| P4 metrics 取证 | 删除 `src/client/metrics-stamp.ts`，还原 `index.ts` / `conversation-metrics.ts` 中的 stamp 调用 |
| P5 capture | 删除 `capture/*.json`（保留 `.example`）、`scripts/capture-hint.mjs` |

## 资产回退（left-light 黑边）

1. 从 git 恢复旧图：`git checkout -- assets/taffy/left-light.webp assets/taffy/left-light.png`
2. 或调高 `assets/taffy/baseline.json` 里 `darkEdgeRatioMax`（不推荐）
3. 重跑 `npm run verify:assets`

## 3080 装回 Release 包

```powershell
cd E:\DeepSeekHarness\profiles\web
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
dsh web
```

或使用本地 pack 冒烟：`npm run install:release`

## 切勿手改 profile package.json

`ConvertTo-Json | Set-Content -Encoding utf8` 会写入 UTF-8 BOM，导致 DSH 无法解析。请始终使用 `pnpm add` / `dsh plugin add`。

## 跳过资产门控（仅本地）

```powershell
$env:SKIP_ASSET_GATES = "1"
npm run build
```

## 关闭运行时 metrics 写入

```javascript
localStorage.setItem('dsh-taffy-theme:metrics', '0')
```
