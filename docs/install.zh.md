# 安装指南（普通用户）

一条命令安装，**无需**克隆仓库、**无需**本地 `npm build`。

## 你需要什么

| 项目 | 要求 |
| --- | --- |
| 平台 | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **Web** profile |
| DSH 版本 | `0.1.0-rc.6` 或更高 |
| 其他 | 已能正常打开 `dsh web`（默认 `http://127.0.0.1:3080`） |

> 仅支持 **Web** 界面，不支持纯 CLI / 其他 profile。

## 安装（推荐）

在终端执行：

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
```

若 `latest` 尚未指向 0.1.2，可改用固定版本：

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
```

然后：

1. **重启** Web：`dsh web`（或停掉旧进程再启动）
2. 浏览器打开 DSH Web，**硬刷新**（Ctrl+F5）
3. 进入 **设置 → 通用 → Taffy 模式**，确认总开关为 **开**

深浅色跟随 DSH 全局：**设置 → 外观 → 浅色 / 深色 / 跟随系统**。

## 安装后自检（30 秒）

- [ ] 页面出现花房 / 霓虹舞台壁纸与粉金对话框
- [ ] **设置 → 通用** 里能看到 Taffy 滑块（背景纱、面板透明度等）
- [ ] 浅色对话字为深墨色，深色为金粉暖白（带轻微光晕）
- [ ] 设置对话框能正常点开、可点击

全部打勾即安装成功。

## 可选：塔菲口吻

皮肤与说话方式**独立**：

- 只想要界面 → 开 **Taffy 模式** 即可
- 想要塔菲人设 → 在 **Agent 预设** 里另选 **「Taffy 塔菲」**

详见 [usage.zh.md](usage.zh.md)。

## 升级

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
dsh web
```

浏览器硬刷新即可。`localStorage` 里的 Taffy 设置会保留。

## 卸载 / 回退

```bash
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
dsh web
```

刷新后界面恢复 DSH 默认。若要装回官方 Release：

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.3/dsh-external-dsh-taffy-theme-0.1.3.tgz
```

## 常见问题

### 装了但完全没变化

1. 确认用的是 **Web profile**（`dsh web`），不是别的 profile
2. **硬刷新**浏览器，或重启 `dsh web`
3. 打开 **设置 → 通用 → Taffy 模式**，确认总开关为开
4. 检查是否同时装了多个 UI 主题插件，只保留一个

### `dsh web` 起不来 / JSON 解析错误

**不要手改** `profiles/web/package.json`。请用 `dsh plugin add` 安装。若已损坏，从备份恢复或重新初始化 web profile 后再装插件。

### 对话字看不清

在 **Taffy 模式** 里把 **背景纱** 调到 14%–18%，或略提高 **面板透明度**。深色下可开启 **减弱动效**。

### 和其他插件叠在一起发灰 / 透明

本主题亚克力为 **按需启用**，不会全局磨砂第三方插件。若某插件仍异常，请 [提 Issue](https://github.com/lengzhanbao/dsh-taffy-theme/issues) 并说明插件名与 DSH 版本。

### 升级 DSH 后布局错位

主题依赖 DSH Web 的 DOM 结构（对话区、侧栏等）。DSH 大版本升级后请安装**最新 Release**；仍有问题请带版本号反馈。

## 开发者 / 贡献者

本地开发与发版见 [environment-baseline.md](environment-baseline.md)、[rollback.md](rollback.md)。

```powershell
# 生产式冒烟（pack → profile）
npm run install:release
dsh web
```

**请勿**把 `git clone` + `npm link` 当作普通用户安装方式对外宣传。
