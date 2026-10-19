# DSH Desktop 验收 runbook

对象：`E:\Deepseek harness\dsh-taffy-theme` @ `compat/dsh-0.2.x`
目标：在**真实 Electron 渲染进程**（`dsh-app://app`）里观测 Taffy 是否挂载并正常渲染。

> 为什么需要你亲自跑：桌面版有单实例锁，同一 Windows 账户下起不了第二个实例
> （实测 `--user-data-dir` 不生效，新进程立即退出），而 `E:\DeepSeekHarness\profiles\desktop` 
> 是当前桌面实例正在使用的 profile，只可读不可写入安装。所以这一步只能由你发起。
>
> **两条路线，选一条**：
> - **路线 A（推荐）**：新开一个 Windows 账户做账户级隔离，不碰你现有环境；
>   你只负责建账户、装插件、带 CDP 启动，探针与证据我来收。见下方「路线 A」。
> - **路线 B**：就在你当前实例跑，最快，但有配置层改动（有备份与一条命令回滚）。
>   见下方第 0–9 步。

**代价（仅路线 B）**：第 2 步要完全退出桌面版，当前对话所在的进程会结束。重新打开桌面版后，
对话记录仍在，可以继续。路线 A 因为用快速用户切换，**不会结束当前会话**。

---

## 交付物指纹（本轮）

| 项 | 值 |
| --- | --- |
| tarball | `dsh-external-dsh-taffy-theme-0.1.9.tgz` |
| bytes | 2090022 |
| SHA-256 | `21BA17DCDFC9EB588EB66274224D31628818E2FDA25E1FE9E676009D2E58746C` |
| version | `0.1.9` |
| commit | `0d6fe0335f70526826f34e25cda71a7e7b2a52c1` |
| branch | `compat/dsh-0.2.x` |
| 门禁 | `npm run ci` → exit 0（peers / preset / assets / static / typecheck / 119 tests / pack 56 项） |

重新打包后 SHA-256 会变，用 `Get-FileHash` 重新记录即可。

---

## 为什么这份验收必须由你执行（本机隔离能力实测）

在把任务交给你之前，先穷举过本机能提供的隔离手段，结论是**一个都不成立**：

| 隔离手段 | 本机状态 | 依据 |
| --- | --- | --- |
| Windows Sandbox | **不存在** | Windows 11 **家庭版**（Build 26200）；`C:\Windows\System32\WindowsSandbox.exe` = False。家庭版不提供该功能 |
| Hyper-V / 虚拟机 | **不存在** | 无 `Get-VM` cmdlet；家庭版不含 Hyper-V |
| 提权启用上述功能 | **不可用** | 本会话审批被禁用，无法触发 UAC |
| 复用 `CodexSandboxOffline` / `CodexSandboxOnline` | **无凭据** | 两账户由 Codex 工具创建，`PasswordRequired: True`；不应猜测他人账户密码 |
| 独立安装包重装 | **不存在** | Downloads / Desktop 无安装包，无法在全新环境里装入桌面版 |

再加一条已经实测的硬约束：桌面版有单实例锁（`requestSingleInstanceLock` ×1，
`--user-data-dir` 在 asar 中出现 **0 次**），同账户下启动第二个实例会立即退出
（实测新进程 PID 47920 秒退，进程数前后都是 7）。

因此本机能给出的**唯一**真实桌面证据来源，就是你正在使用的那个实例。
按「不绕过单实例锁、不擅动用户运行环境」的约束，这一步只能由你决定是否执行、
并在你控制的时机执行。本 runbook 为此准备了两件事：第 3 步的配置层备份，
和第 8 步的一条命令回滚。

### 为什么不能拿 `dsh web` 的结果顶替

桌面版自带的运行时上确实可以跑 `dsh web`（`docs/DESKTOP-RUNTIME-EVIDENCE.md` 记录的
安装门与素材路由 200 就是这么测出来的）。它能证明**宿主服务、装载门、路由注册**，
但跑的不是 `dsh-app://app` 渲染进程，**不能**作为桌面渲染兼容的证据。
要观测渲染进程，只有带 `--remote-debugging-port` 启动真实桌面实例这一条路。

---

## 路线 A：第二 Windows 账户（真正的账户级隔离）

本机是 Windows 11 家庭版，没有 Windows Sandbox / Hyper-V。但**不需要虚拟机** ——
`DSH_HOME` 是**用户级**环境变量（实测 `DSH_HOME [User] = E:\DeepSeekHarness`，
`[Machine]` 未设置），而 Electron 的 userData 本来就在 `%APPDATA%` 下按用户隔离。
换一个账户就同时换掉了：

| 隔离项 | 为什么自动隔离 |
| --- | --- |
| Electron userData | `%APPDATA%` 按用户分离 |
| **单实例锁** | 锁挂在 userData 上 → 天然不冲突，**不需要绕过任何东西** |
| `DSH_HOME` | 用户级变量不跨账户继承 |
| 插件安装位置 / profiles / sessions / storages | 全部落在该账户自己的 `DSH_HOME` |
| 你现有的 `E:\DeepSeekHarness` | 完全不被触碰 |

已验证的前提：`BUILTIN\Users` 对 `E:\`、`E:\Deepseek harness` 及其子目录有
**ReadAndExecute**，所以新账户能执行桌面版、能读 tarball。

### A1. 建账户（在 SYH 会话，需要一次 UAC）

```powershell
Start-Process pwsh -Verb RunAs -ArgumentList '-NoExit','-Command',
  'net user DshTest <你定的密码> /add'
```

**不要**把它加进 Administrators。用完删掉即可（见 A6）。

### A2. 切到该账户

开始菜单 → 用户头像 → 切换用户。**快速用户切换不会结束 SYH 的会话**，
当前对话与那个带单实例锁的桌面实例都继续活着。

### A3. 在新账户里钉死 DSH_HOME（关键，别跳）

在新账户的 PowerShell 里：

```powershell
# 持久化为「用户级」，这样开始菜单启动的 app 也继承得到
[Environment]::SetEnvironmentVariable('DSH_HOME', 'C:\DSH-Test', 'User')
$env:DSH_HOME = 'C:\DSH-Test'   # 当前会话也生效
```

> **陷阱**：只在 PowerShell 会话里临时设 `$env:DSH_HOME`，然后从开始菜单启动 app，
> app 不继承它 —— 结果插件装进 A 目录、运行却读 B 目录，验收结论全错。
> 所以必须持久化，并且 A4/A5 也从**设过变量的同一个窗口**启动。

### A4. 首次启动初始化 profile，然后完全退出

```powershell
Start-Process 'E:\Deepseek harness\DeepSeek Harness.exe'
```

等界面完全起来 → 菜单退出 → 确认：

```powershell
Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
# 期望 0
Test-Path 'C:\DSH-Test\profiles\desktop'
# 期望 True —— 若为 False，说明 DSH_HOME 没被采纳，停下告诉我，别继续
```

那个 `Test-Path` 是本路线的**自检闸门**：它确保插件会装进这个一次性目录，
而不是别处。

### A5. 装插件 + 带 CDP 启动

```powershell
& 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd' `
    plugin --profile desktop add 'E:\Deepseek harness\dsh-taffy-theme\dsh-external-dsh-taffy-theme-0.1.9.tgz'

Select-String -Path 'C:\DSH-Test\profiles\desktop\package.json' -Pattern 'taffy'   # 确认写入

Start-Process 'E:\Deepseek harness\DeepSeek Harness.exe' -ArgumentList '--remote-debugging-port=9333'
```

启动参数里**必须**有 `--remote-debugging-port=9333`，否则探针连不上。

### A6. 回到 SYH 会话，我来收证据

TCP 回环是整机范围的，不按会话隔离 —— 所以**我在 SYH 会话里就能探到新账户那个
`dsh-app://app` 渲染进程**。切回来告诉我，我跑：

```powershell
cd 'E:\Deepseek harness\dsh-taffy-theme'
node scripts/desktop-accept.mjs light      # 我跑
# 你在新账户里切成深色 → 切回来告诉我
node scripts/desktop-accept.mjs dark       # 我跑
```

第 6 步的人工清单同样在新账户里对照。收尾时卸载并删账户：

```powershell
& 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd' plugin --profile desktop remove @dsh-external/dsh-taffy-theme
# 回到 SYH 会话，提权执行：
Start-Process pwsh -Verb RunAs -ArgumentList '-NoExit','-Command','net user DshTest /delete'
Remove-Item 'C:\DSH-Test' -Recurse -Force
```

---

## 路线 B：就在当前实例跑

即下面第 0–9 步的原始流程。同一台机器、同一个账户，代价是插件进入你日常环境
（第 3 步有配置层备份，第 8 步一条命令回滚）。

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

