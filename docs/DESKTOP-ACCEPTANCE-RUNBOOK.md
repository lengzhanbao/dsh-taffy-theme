# DSH Desktop 验收 runbook

对象：`E:\Deepseek harness\dsh-taffy-theme` @ `compat/dsh-0.2.x`
目标：在**真实 Electron 渲染进程**（`dsh-app://app`）里观测 Taffy 是否挂载并正常渲染。

> 为什么需要你亲自跑：桌面版有单实例锁，同一 Windows 账户下起不了第二个实例
> （实测 `--user-data-dir` 不生效，新进程立即退出），而 `E:\DeepSeekHarness\profiles\desktop`
> 是当前桌面实例正在使用的 profile，只可读不可写入安装。所以最后这一步只能由你在
> 自己的会话里完成。

**代价**：第 2 步要完全退出桌面版，当前对话所在的进程会结束。重新打开桌面版后，
对话记录仍在，可以继续。

---

## 0. 前置确认

```powershell
Get-Content 'E:\DeepSeekHarness\dsh-runtimes\dsh-primary-runtime\runtime.json' |
  Select-String 'desktopVersion'
# 期望：desktopVersion 0.2.1-rc.2
```

不对就到此为止，别往下走 —— 本插件声明的 `engines.dsh` 只覆盖 `>=0.2.1-rc.2 <0.3.0`。

---

## 1. 打包

```powershell
cd 'E:\Deepseek harness\dsh-taffy-theme'
npm run build:ci
npm pack
# 产出：dsh-external-dsh-taffy-theme-0.1.9.tgz
```

---

## 2. 完全退出桌面版

菜单退出，**不要只关窗口**（关闭窗口未必退出进程）。然后确认：

```powershell
Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
# 期望：0
```

> 这一步之后当前对话进程结束。重新打开桌面版即可继续，历史记录还在。

---

## 3. 备份 + 装进 desktop profile

```powershell
# 备份（只备份配置层，不含 node_modules）
$p = 'E:\DeepSeekHarness\profiles\desktop'
$bak = "E:\DeepSeekHarness\profiles\desktop.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory $bak | Out-Null
Copy-Item "$p\package.json","$p\cordis.patch.yml" $bak -ErrorAction SilentlyContinue
Copy-Item "$p\pnpm-lock.yaml" $bak -ErrorAction SilentlyContinue
"备份到 $bak"

# 安装（用桌面自带 CLI）
$env:DSH_HOME = 'E:\DeepSeekHarness'
& 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd' `
    plugin --profile desktop add 'E:\Deepseek harness\dsh-taffy-theme\dsh-external-dsh-taffy-theme-0.1.9.tgz'
```

期望：退出码 0，输出里有 `@dsh-external/dsh-taffy-theme 0.1.9`。

如果它提示 `Open DeepSeek Harness Desktop once to initialize its profile, then fully quit it`
—— 说明进程没退干净，回第 2 步。

确认写进去了：

```powershell
Select-String -Path 'E:\DeepSeekHarness\profiles\desktop\package.json' -Pattern 'taffy'
```

---

## 4. 带 CDP 重新打开桌面版

探针要靠 DevTools 协议读渲染进程。**必须带这个参数启动**：

```powershell
Start-Process 'E:\Deepseek harness\DeepSeek Harness.exe' -ArgumentList '--remote-debugging-port=9333'
```

（也可以给快捷方式的目标后面加这个参数。不带它，第 5 步会连不上。）

等界面完全起来，进入一个有对话的页面。

---

## 5. 跑探针

新开一个 PowerShell 窗口：

```powershell
cd 'E:\Deepseek harness\dsh-taffy-theme'
node scripts/desktop-accept.mjs light
```

> 这个探针已经在真实 0.2.1-rc.2 实例 + 真实 Chromium（Edge 155 headless，走 CDP）上自测过一次，
> 8/8 全绿、`exit 0`，见 `docs/DESKTOP-RUNTIME-EVIDENCE.md` §5.1。连不上时它会明确告诉你
> 是「端口没开」还是「没找到 `dsh-app://app` 目标」并列出实际看到的目标 URL。

期望：`✓` 全绿，尤其这几条 ——

| 检查 | 含义 |
| --- | --- |
| `body 带 taffy 标记` | host 的 `tapIndex` 与客户端都跑了 |
| `样式节点已注入` | 主题 CSS 真的进了 DOM |
| `装饰节点已挂载` | 皮肤装饰节点到位 |
| `立绘已挂载` + `立绘已解码` | 素材经 `/plugins/**` 转发**成功取回并解码** |
| `素材无加载错误` | 没有 `data-taffy-asset-error` |
| `状态机在跑` | `data-taffy-state` 是 idle/streaming/tool-calling |
| `主题 token 生效` | `--ds-taffy-cream` 有值 |

`立绘已解码` 那几行会打印每张图的 `宽x高` 和 URL。**URL 应该以 `/plugins/@dsh-external/...` 开头** ——
这就是 §3 转发链路在渲染进程里被真正走通的直接证据。

然后**在界面里切换一次明暗主题**，再跑：

```powershell
node scripts/desktop-accept.mjs dark
```

期望多出一行 `✓ light→dark 真的变了`。

---

## 6. 人工清单（脚本管不到的视觉项）

逐项点一遍，把不符合的记下来：

1. **明暗切换**：浅色看花房壁纸 + 立绘；切深色看夜景配色，文字仍清晰。
2. **设置持久化**：改一个 Taffy 设置（比如强度/壁纸开关）→ 重启桌面版 → 设置还在。
3. **壁纸与立绘**：壁纸铺满、左右立绘不被侧栏裁切、侧栏 Q 版头像可见。
4. **右栏 / 工具卡 / composer**：展开右侧面板；发一条会调用工具的消息，看工具卡样式；
   输入框的粉金描边与四角纹样在。
5. **窗口缩放**：拖到很窄再拉宽，立绘与 composer 不破版、不重叠。
6. **设置项入口**：打开「设置 → 通用」，确认有 Taffy 那一行（脚本里的 `settings general rows` 应 ≥ 1）。
7. **禁用 / 卸载 / 重装**：见第 7 步。
8. **重启后残留**：重启桌面版，跑 `node scripts/desktop-accept.mjs after-restart`，应仍全绿且
   无 `无残留 taffy 样式节点` 报错。

---

## 7. 禁用 / 卸载 / 重装 + 残留检查

桌面版没有 CLI 级的 enable/disable（`dsh plugin` 只是把参数转给 pnpm），
所以「禁用」走应用内的插件管理界面，或直接卸载。

**卸载**（桌面版需先退出）：

```powershell
$env:DSH_HOME = 'E:\DeepSeekHarness'
& 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd' `
    plugin --profile desktop remove @dsh-external/dsh-taffy-theme
```

重开桌面版后跑残留检查：

```powershell
node scripts/desktop-accept.mjs residual
```

期望四条都是 ✓：`body 已无 taffy 标记`、`样式节点已移除`、`装饰节点已清空`、
`无残留 taffy 样式节点`。这一条同时验证了「卸载后不留垃圾」。

**重装**：重复第 3、4 步，再跑 `light` 确认恢复。

---

## 8. 回滚（出问题就用这个）

```powershell
$env:DSH_HOME = 'E:\DeepSeekHarness'
& 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd' `
    plugin --profile desktop remove @dsh-external/dsh-taffy-theme
```

还不行，就把第 3 步的备份目录里那几个文件复制回 `E:\DeepSeekHarness\profiles\desktop`。

Taffy 的 `apply()` 现在不会抛错、存储层有降级兜底，所以最坏情况是「主题没生效」，
不该把界面搞挂。真挂了就是重要发现，请连同下面这份报告一起给我。

---

## 9. 把结果交回来

```powershell
Get-Content 'E:\Deepseek harness\dsh-taffy-theme\.cache\desktop-accept-report.json'
```

这份 JSON 里是渲染进程内的实测快照（`light` / `dark` / `residual` 各一段）。
把它、以及第 6 步人工清单里任何不符合的项发我，我据此更新
`docs/DESKTOP-RUNTIME-EVIDENCE.md` 的「仍未验证」表，并决定是否需要改代码。

---

## 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 探针报 `Cannot reach the DevTools endpoint` | 没带 `--remote-debugging-port=9333` | 回第 4 步，先退干净再带参启动 |
| 探针报 `No dsh-app://app target found` | 界面还在启动页 / 目标列表为空 | 等界面完全起来再跑；报错里会列出实际看到的目标 URL |
| 装完界面里完全没变化 | 插件未被启用 | 看应用内插件管理界面是否需要手动启用 |
| 有 `data-taffy-asset-error` | 素材 404 | 把探针打印的图片 URL 发我，对照 `DESKTOP-RUNTIME-EVIDENCE.md` §2 |
| 立绘在但尺寸是 `0x0` | 图未解码 | 等 2 秒重跑；仍为 0 说明取回的不是有效 webp |
