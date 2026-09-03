# 环境基线

记录时间：2026-08-22（v0.1.2 已发布；awesome-dsh-plugin PR 待合并）

| 项 | 值 |
| --- | --- |
| DSH_HOME | `E:\DeepSeekHarness` |
| 当前版本 | `0.1.2`（本地已 commit；GitHub Release / tag 待打） |
| Web profile | `E:\DeepSeekHarness\profiles\web` |
| 默认端口 | `http://127.0.0.1:3080` |
| Node | ≥ 20（与 DSH 一致） |
| Python | ≥ 3.11 + Pillow（仅 `verify:assets` / CI） |
| PowerShell | 7+ 或 Windows PowerShell 5.1（仅 `npm run build` / `install:*`） |
| 已发布 tag | `v0.1.2`（latest）；`v0.1.1` 可作回滚 |

## 对外安装（与 README 一致）

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
dsh web
```

固定版本：

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
```

## 开发者 link

```powershell
$env:DSH_HOME = "E:\DeepSeekHarness"
npm run install:dev
dsh web
```

## CI（GitHub Actions）

每次 push / PR 到 `master` 自动执行：

```bash
npm run ci
# = verify:assets → verify:static → test → verify:pack
```

CI **不**跑 `npm run build`（需本机 `DSH_CHECKOUT` + PowerShell 链 DSH 包）。发 tarball 前在 Windows 开发者环境额外跑 `npm run build` 与 `install:release`。

## 发版前冒烟

```powershell
npm run ci
npm run build
npm run install:release
```

更新插件 tarball 后需**重启** `dsh web`（host 静态路由不 HMR）。
