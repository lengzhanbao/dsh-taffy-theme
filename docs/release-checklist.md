# v0.1.2 发版清单

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
git commit -m "docs: align release docs and install URLs to v0.1.2"
git tag v0.1.2
git push origin master --tags
```

（若 release commit 已存在，仅打 tag 并 push。）

## GitHub Release

1. **New release** → tag `v0.1.2`
2. Title: `v0.1.2 — 静态资源路由、精简 client bundle、性能节流`
3. 附上 [CHANGELOG.md](../CHANGELOG.md) 中 **0.1.2** 条目
4. 上传资产：`npm pack` 生成的 `dsh-external-dsh-taffy-theme-0.1.2.tgz`
5. 确认 `latest` 指向本 Release

或使用 gh：

```bash
npm pack --pack-destination E:\taffy\.cache\downloads
gh release create v0.1.2 E:\taffy\.cache\downloads\dsh-external-dsh-taffy-theme-0.1.2.tgz \
  --title "v0.1.2 — 静态资源路由、精简 client bundle、性能节流" \
  --notes "$(sed -n '/^## 0.1.2/,/^---/p' CHANGELOG.md | head -n -1)"
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

- 安装：`dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.2.tgz`
- 无需 API Key；要求 DSH Web `0.1.0-rc.6+`
- 截图：README 中 `preview/light.webp`、`preview/dark.webp`
```

## 发版后

- [ ] README / install 文档中的 `latest` 链接可下载
- [ ] `dsh plugin add ...latest...` 在干净 profile 冒烟通过
- [ ] awesome-dsh-plugin PR（`docs/market/lengzhanbao__dsh-taffy-theme.yml`）

## 回滚

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.1/dsh-external-dsh-taffy-theme-0.1.1.tgz
```
