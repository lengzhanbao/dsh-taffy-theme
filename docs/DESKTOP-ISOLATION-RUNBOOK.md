# DSH Desktop 隔离验收 Runbook

> 用途：在**不触碰日常环境**的前提下，验证 Taffy 在官方 DSH Desktop 上的安装与运行。
> 为什么需要你手动执行：见 §1。

---

## 1. 为什么这一步必须由你执行

**循环依赖**：隔离测试要求关闭正在运行的桌面实例，而**这个 agent 会话本身就跑在那个实例里**（GUI `http://127.0.0.1:10480`）。我无法既关闭宿主、又在宿主里继续执行。

**未满足你的前置条件**（原文：「如果无法证明 Electron 用户数据也已隔离，就先不要启动正式实例」）：

| 你的要求 | 实际情况 |
| --- | --- |
| `DSH_HOME` 隔离 | ✅ 可做到（`DSH_HOME` 环境变量已实测有效） |
| **Electron userData 也已隔离** | ❌ **无法事先证明** —— 存在**三个**独立数据根，见 §2 |
| 不转发给正在使用的正式实例 | ❌ **当前有 6 个桌面进程在运行**（主实例 12:31:41 启动）。Electron 的 `requestSingleInstanceLock()` 可能把带隔离参数的新启动转发给主实例 |

所以我**没有启动**。下面是可以安全执行的流程。

---

## 2. 三个数据根（实测，必须全部隔离）

| 路径 | 规模（2026-10-19 基线） |
| --- | --- |
| `E:\DeepSeekHarness` | 6,705 文件 / 376,657,349 bytes |
| `%APPDATA%\dsh-desktop` | 1,315 文件 / 112,727,410 bytes |
| `%APPDATA%\@deepseek-ai\dsh-desktop` | 235 文件 / 22,297,352 bytes |

后两者子目录形状相同（`blob_storage`、`Cache`、`Code Cache`、`DawnGraphiteCache`、`DawnWebGPUCache`、`Dictionaries`…），是**两个分开的 Chromium profile 根**。`--user-data-dir` 通常只影响其中一个，另一个可能由应用用 `app.setPath()` 或独立 partition 指定 —— **这是无法事先证明的部分**。

---

## 3. 执行流程

### 3.0 准备（可先做，不启动应用）

```powershell
# 记录基线指纹，用于事后判定"有没有写到正式数据"
$roots = @("E:\DeepSeekHarness", "$env:APPDATA\dsh-desktop", "$env:APPDATA\@deepseek-ai\dsh-desktop")
foreach ($r in $roots) {
  $f = Get-ChildItem $r -Recurse -File -Force -ErrorAction SilentlyContinue
  "{0}`t{1}`t{2}" -f $r, $f.Count, ($f | Measure-Object Length -Sum).Sum
} | Tee-Object "$env:TEMP\taffy-desktop-baseline.txt"
```

同时**记录当前时间**，便于事后只比对"新写入/修改过的文件"。

### 3.1 完全退出桌面应用

必须**完全退出**（托盘也要退），确认进程归零：

```powershell
Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue   # 期望：无输出
```

> ⚠️ 退出桌面应用会**同时结束当前这个会话**。请先保存/记住本文件路径。

### 3.2 用隔离目录启动

```powershell
$iso = "E:\dsh-desktop-iso"          # 建议放非系统盘，便于事后整体删除
New-Item -ItemType Directory -Force -Path $iso | Out-Null

$env:DSH_HOME = "$iso\DSH_HOME"
& 'E:\Deepseek harness\DeepSeek Harness.exe' --user-data-dir="$iso\electron-userdata" --no-sandbox
```

让应用**初始化一次 profile**，然后**完全退出**。

### 3.3 判定隔离是否真的成立（关键闸门）

对比 §3.0 的基线：

- ✅ **三个根的"新增/修改文件数"都应为 0** → 隔离成立，可以继续
- ❌ 若任一正式根出现新写入 → **隔离不成立，立即停止**，改用其他方案（见 §5）

### 3.4 用桌面自带 CLI 安装（此时应用已退出）

```powershell
$cli = 'E:\Deepseek harness\resources\runtime\cli\bin\dsh.cmd'
$env:DSH_HOME = "E:\dsh-desktop-iso\DSH_HOME"

# 注意：不要设 --user-data-dir，CLI 不走 Electron
& $cli plugin --profile desktop add <tarball 路径>

# 确认收录
& $cli --profile desktop --dump-config | Select-String 'dsh-taffy-theme'
```

> 早前在**空**隔离目录上直接跑 CLI 会得到 `error: profile "desktop" is managed exclusively by the Electron application`。必须先完成 §3.2 的应用初始化，CLI 才能管理该 profile。

### 3.5 启动并验收

用 §3.2 的同一组参数再次启动，逐项核对：

| # | 验收项 |
| --- | --- |
| 1 | 应用能启动，无 `did not activate` / 启动失败页 |
| 2 | 背景壁纸与角色素材加载（`/plugins/@dsh-external/dsh-taffy-theme/assets/...` 返回 200） |
| 3 | 浅色 / 深色主题切换有效 |
| 4 | 右侧面板、工具卡片、输入框正常 |
| 5 | 设置改动在**重启后**仍保留 |
| 6 | 停用 → 卸载 → 重启：无残留样式 / DOM / 监听器 |
| 7 | 窗口隐藏后重开、不同窗口宽度与缩放比例 |
| 8 | reduced-motion 模式 |

### 3.6 收集证据

```powershell
# 安装前后再次取指纹
Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue | Stop-Process
# 打包隔离目录供分析
Compress-Archive -Path "E:\dsh-desktop-iso" -DestinationPath "$env:TEMP\dsh-desktop-iso.zip"
```

---

## 4. 我可以在你执行后接手分析的部分

- 隔离目录 / zip 与 `--dump-config` 输出
- 应用日志（`%APPDATA%\dsh-desktop\logs` 的隔离副本）
- 资产路由的响应码与 content-type
- 安装前后的指纹差异

---

## 5. 如果 §3.3 判定隔离失败

备选（按代价排序）：

1. **Windows 沙箱 / 独立用户账户**运行桌面应用 —— 数据根天然分离，最干净；
2. 先在**另一台机器**或虚拟机验证；
3. 接受"只隔离 `DSH_HOME`"，但**明确记录** Electron 侧未隔离及其风险 —— 这与你设定的准入标准冲突，不建议。

---

## 6. 当前状态

- 分支 `compat/dsh-0.2.x`，19 个提交，**未推送、未发布**
- `web` profile 已在隔离的 DSH `0.2.1-rc.2` 上完成安装 / 启动 / 浏览器验收 10/10 —— **但这不构成桌面兼容证据**
- 桌面版：**仅完成静态审计**（见 `DESKTOP-AUDIT-2026-10-19.md`），**未安装、未运行、未验收**

---

## 7. 隔离证据的强化要求（本文件为唯一验收依据）

> **重要**：文件数量与总字节数相同**不构成**内容未被修改的证据（同尺寸改写、等量增删、时间戳更新都会漏掉）。
> 必须用 **SHA-256 清单**做对账。

### 7.1 三个正式数据根的完整清单 + SHA-256

对每个根分别生成清单（含相对路径、字节数、mtime、SHA-256），**在启动前和启动后各做一次**：

```powershell
$roots = @("E:\DeepSeekHarness", "$env:APPDATA\dsh-desktop", "$env:APPDATA\@deepseek-ai\dsh-desktop")
$out = "$env:TEMP\taffy-manifest-before"      # 事后改成 -after
New-Item -ItemType Directory -Force -Path $out | Out-Null
foreach ($r in $roots) {
  $tag = ($r -replace '[:\\@]','_')
  Get-ChildItem $r -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
    [pscustomobject]@{
      path = $_.FullName.Substring($r.Length)
      size = $_.Length
      mtime = $_.LastWriteTimeUtc.ToString('o')
      sha256 = (Get-FileHash $_.FullName -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
    }
  } | Export-Csv "$out\$tag.csv" -NoTypeInformation -Encoding UTF8
}
```

### 7.2 新增 / 修改 / 删除的独立统计

```powershell
foreach ($tag in @('_E__DeepSeekHarness','_C__Users_SYH_AppData_Roaming_dsh-desktop','_C__Users_SYH_AppData_Roaming__deepseek-ai_dsh-desktop')) {
  $a = Import-Csv "$env:TEMP\taffy-manifest-before\$tag.csv"
  $b = Import-Csv "$env:TEMP\taffy-manifest-after\$tag.csv"
  $ka = @{}; $a | ForEach-Object { $ka[$_.path] = $_.sha256 }
  $kb = @{}; $b | ForEach-Object { $kb[$_.path] = $_.sha256 }
  $added   = $kb.Keys | Where-Object { -not $ka.ContainsKey($_) }
  $deleted = $ka.Keys | Where-Object { -not $kb.ContainsKey($_) }
  $changed = $kb.Keys | Where-Object { $ka.ContainsKey($_) -and $ka[$_] -ne $kb[$_] }
  "== $tag"
  "   新增 {0} / 删除 {1} / 内容变更 {2}" -f @($added).Count, @($deleted).Count, @($changed).Count
  @($added + $deleted + $changed) | Select-Object -First 20 | ForEach-Object { "     $_" }
}
```

> `mtime` 变化但 `sha256` 相同 → 只读触碰，可接受但需记录；
> `sha256` 变化 → **内容真的被改了**。

### 7.3 Electron 身份核对（PID / 命令行 / 真实 userData / partition）

启动隔离实例后、以及**任何操作之前**，核对它确实是隔离实例：

```powershell
Get-CimInstance Win32_Process -Filter "Name='DeepSeek Harness.exe'" |
  Select-Object ProcessId, CommandLine | Format-List
```

必须满足：

| 检查 | 期望 |
| --- | --- |
| `CommandLine` 含 `--user-data-dir=<隔离目录>` | ✅ 出现 |
| `CommandLine` 中**不出现** `E:\DeepSeekHarness` 或正式 userData 路径 | ✅ |
| 进程启动时间 | 晚于本次启动命令 |
| 隔离 userData 目录内出现 `Local Storage` / `Network` / `Cache` | ✅ 证明它真的在用这个目录 |

`partition` 无法从命令行看出。间接判定：启动后检查 **`%APPDATA%\@deepseek-ai\dsh-desktop` 的 SHA-256 是否零变更** —— 若有变更，说明存在未被 `--user-data-dir` 覆盖的第二个 profile 根。

### 7.4 识别 `requestSingleInstanceLock()` 造成的启动转发

症状（出现任一即视为**启动被转发**）：

- 新进程**立刻退出**，而原实例仍在运行（PID 未变）
- 隔离目录内**始终没有** `Local Storage` / `Network` / `Cache`
- 原实例窗口被激活或前置
- 原实例的 `CommandLine` 不含 `--user-data-dir`

出现即**停止**：说明启动请求被转给了正在使用的正式实例。

### 7.5 立即停止的条件（硬闸门）

任一条成立 → **立即停止，不继续安装**，并保留全部清单与日志：

1. 三个正式根中任一出现 **sha256 变更或新增/删除文件**；
2. 新进程命令行**不含** `--user-data-dir`，或含正式路径；
3. 隔离目录内**没有**生成 Chromium profile 子目录（说明没真正用隔离目录）；
4. 检测到 §7.4 的启动转发症状；
5. 启动前 `Get-Process -Name 'DeepSeek Harness'` **非空**（正式实例仍在运行）。

### 7.6 替代方案（隔离无法证明时）

按代价从低到高：

1. **独立 Windows 本地账户**：为测试建一个临时账户，登录后运行桌面应用。该账户的 `%APPDATA%` / `%LOCALAPPDATA%` 天然与你的主账户分离，`DSH_HOME` 再指向测试目录即可 —— **隔离性最强、最容易证明**（正式账户的三个根根本不会被该进程访问）。
2. **Windows 沙箱（Windows Sandbox）** 或容器：整个文件系统是一次性的，测试完直接丢弃。
3. **虚拟机 / 另一台机器**：最彻底，代价最高。
4. **仅隔离 `DSH_HOME`**：**不满足**本文件的准入标准，不建议采纳。

### 7.7 与"不要用数量/字节数当证据"对应的验收表述

最终报告里应写：

- 三个根的 **sha256 清单差异**（新增/删除/变更各几项、具体路径）
- 而不是"文件数和字节数没变"