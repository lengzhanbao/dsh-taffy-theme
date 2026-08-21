# v0.1.1 发版清单

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
# 浏览器验收：浅色/深色对话字、光晕、设置可点、框跟随对话区
```

## Git

```bash
git add -A
git commit -m "release: v0.1.1 — install docs, typography, pack stability"
git tag v0.1.1
git push origin main --tags
```

## GitHub Release

1. **New release** → tag `v0.1.1`
2. Title: `v0.1.1 — 下载即用稳定性与对话可读性`
3. 附上 [CHANGELOG.md](../CHANGELOG.md) 中 0.1.1 条目
4. 上传资产：`npm pack` 生成的 `dsh-external-dsh-taffy-theme-0.1.1.tgz`
5. 确认 `latest` 指向本 Release

或使用 gh：

```bash
npm pack --pack-destination E:\taffy\.cache\downloads
gh release create v0.1.1 E:\taffy\.cache\downloads\dsh-external-dsh-taffy-theme-0.1.1.tgz \
  --title "v0.1.1" \
  --notes-file CHANGELOG.md
```

## 发版后

- [ ] README 安装链接可下载
- [ ] `dsh plugin add ...latest...` 在干净 profile 冒烟通过
- [ ] awesome-dsh-plugin PR（仓库满 1 天后）

## 回滚

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.0/dsh-external-dsh-taffy-theme-0.1.0.tgz
```
