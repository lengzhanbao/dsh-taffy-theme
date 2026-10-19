# v0.1.9 发版清单

## 发版前

```powershell
$env:TEMP = "E:\taffy\.cache\temp"
$env:TMP = "E:\taffy\.cache\temp"
cd E:\DeepSeekHarness\projects\dsh-taffy-theme

npm test
npm run verify:static
npm run verify:assets
npm run verify:pack
npm run install:release
# 浏览器验收：浅色/深色立绘与图片、设置→模型、Taffy 模式滑块、框跟随对话区
# 更新 tarball 后重启 dsh web
```

## Git

```bash
git add -A
git commit -m "docs: align release docs and install URLs to v0.1.9"
git tag v0.1.9
git push origin master --tags
```

（若 release commit 已存在，仅打 tag 并 push。）

## GitHub Release

1. **New release** → tag `v0.1.9`
2. Title: `v0.1.9 — 静态资源路由、精简 client bundle、性能节流`
3. 附上 [CHANGELOG.md](../CHANGELOG.md) 中 **0.1.9** 条目
4. 上传资产：`npm pack` 生成的 `dsh-external-dsh-taffy-theme-0.1.9.tgz`
5. 确认 `latest` 指向本 Release

或使用 gh：

```bash
npm pack --pack-destination E:\taffy\.cache\downloads
gh release create v0.1.9 E:\taffy\.cache\downloads\dsh-external-dsh-taffy-theme-0.1.9.tgz \
  --title "v0.1.9 — 静态资源路由、精简 client bundle、性能节流" \
  --notes "$(sed -n '/^## 0.1.9/,/^---/p' CHANGELOG.md | head -n -1)"
```

## GitHub 仓库（dsh-market 收录）

- [ ] Settings → Topics 添加 **`dsh-plugin`**（建议再加 `deepseek-harness`、`theme`）
- [ ] 提交 [dsh-market 插件 issue](https://github.com/2BingLing/dsh-market/issues/new?template=submit_plugin.md)（见下方草稿）
- [ ] 等待次日 06:00 自动收录管道

### Issue 草稿（复制粘贴）

```
[提交插件] Taffy Live Atelier / 塔菲直播工房

## 插件信息

- **GitHub 仓库地址**：https://github.com/lengzhanbao/dsh-taffy-theme
- **插件类型**：cordis-plugin
- **一句话简介**：粉金亚克力 DSH Web 主题：浅色/深色舞台立绘、可调透明层，附带可选 Taffy Agent 预设。
- **作者自述简介**：[Taffy Live Atelier 是为 DeepSeek Harness Web 做的虚拟直播工房式 UI 皮肤。设置里可单独开关和调整透明度；皮肤与 Agent 口吻分离。资源本地打包，仅改外观。]
- **是否已打 dsh-plugin 相关 topic**：是

## 补充说明

- 安装：`dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.9/dsh-external-dsh-taffy-theme-0.1.9.tgz`
- 无需 API Key；要求 DSH Web `0.1.0-rc.6+`
- 截图：README 中 `preview/light.webp`、`preview/dark.webp`
```

## 发版后

- [ ] README / install 文档中的固定版本链接可下载
- [ ] `dsh plugin add ...latest...` 在干净 profile 冒烟通过
- [ ] awesome-dsh-plugin PR（`docs/market/lengzhanbao__dsh-taffy-theme.yml`）

## 回滚

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.9/dsh-external-dsh-taffy-theme-0.1.9.tgz
```

---

## Note: which profile?

Every `--profile web` command above targets the **browser** DSH. **DSH Desktop
uses the `desktop` profile instead**, and installing into the wrong profile has
no effect.

| You are using | profile | data dir (measured on this machine) |
| --- | --- | --- |
| DSH Desktop app | `desktop` | `E:\DeepSeekHarness` |
| Browser DSH (`dsh web`) | `web` | `C:\Users\SYH\.dsh` |

### What is verified for the desktop app

The `desktop` profile is owned exclusively by the Electron app: `dsh --profile
desktop` answers `profile "desktop" is managed exclusively by the Electron
application`, and `dsh plugin --profile desktop add` asks you to open the app
once and quit it first. So the desktop install path is the app's own plugin
manager, not a bare CLI command.

The **runtime** behind the app was verified separately — using the desktop's
bundled CLI (`resources/runtime/cli/bin/dsh.cmd`, pnpm v11.28.5, matching
`runtime.json`) against an isolated `DSH_HOME`:

- `dsh plugin add <tarball>` → `exit 0` (the 0.2.x install gate accepts
  `engines.dsh: ">=0.2.1-rc.2 <0.3.0"`);
- `/plugins/@dsh-external/dsh-taffy-theme/assets/taffy/*.webp` → `200 image/webp`
  with full byte counts; `manifest.json` → `200`; path traversal → `404`.

The desktop shell forwards every non-static path (`/plugins/**` included) to its
Host HTTP server with an injected auth cookie, and serves the same
`dsh-web-frontend/dist` the browser build uses.

**Still unverified:** the plugin's client bundle actually running inside the
Electron renderer. A second Electron instance cannot be started under the same
Windows account (single-instance lock; `--user-data-dir` does not override it —
the new process exits immediately), so that check needs a separate Windows
account or a VM. Until it is done, do not claim "verified on DSH Desktop".

To finish it, follow `docs/DESKTOP-ACCEPTANCE-RUNBOOK.md`: quit the app, install
into the `desktop` profile, relaunch with `--remote-debugging-port=9333`, then run
`node scripts/desktop-accept.mjs light|dark|residual`. That probe reads the live
renderer over the DevTools protocol and writes
`.cache/desktop-accept-report.json`; it was self-tested green on a real
0.2.1-rc.2 instance before being handed over.

See `docs/DESKTOP-RUNTIME-EVIDENCE.md` for the full evidence chain and
`docs/DESKTOP-AUDIT-2026-10-19.md` for the first-stage read-only audit.