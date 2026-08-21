# 环境基线

记录时间：2026-08-22（v0.1.2 待发 Release / dsh-market 收录）

| 项 | 值 |
| --- | --- |
| DSH_HOME | `E:\DeepSeekHarness` |
| 当前版本 | `0.1.2`（本地已 commit；GitHub Release / tag 待打） |
| Web profile | `E:\DeepSeekHarness\profiles\web` |
| 默认端口 | `http://127.0.0.1:3080` |
| Node | ≥ 20（与 DSH 一致） |
| 已发布 tag | `v0.1.0` @ `03032aa`；`v0.1.1` 若已发则可用作回滚 |

## 对外安装（与 README 一致）

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.2.tgz
dsh web
```

固定版本：

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.2/dsh-external-dsh-taffy-theme-0.1.2.tgz
```

## 开发者 link

```powershell
$env:DSH_HOME = "E:\DeepSeekHarness"
npm run install:dev
dsh web
```

## 发版前冒烟

```powershell
npm test
npm run verify:pack
npm run install:release
```

更新插件 tarball 后需**重启** `dsh web`（host 静态路由不 HMR）。
