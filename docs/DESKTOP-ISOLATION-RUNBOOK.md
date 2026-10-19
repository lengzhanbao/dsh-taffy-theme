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
