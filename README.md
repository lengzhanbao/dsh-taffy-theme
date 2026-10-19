# Taffy Astral Atelier / 塔菲星夜工房

[![CI](https://github.com/lengzhanbao/dsh-taffy-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/lengzhanbao/dsh-taffy-theme/actions/workflows/ci.yml)
[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

**为官方 DSH Desktop 打造的塔菲主题** —— 星夜工房背景、可选的九套素材、粉金亚克力对话框、
三档侧栏边框，以及可独立调节的**聊天外观**（自己的消息气泡 / 输入框）。

| | |
| --- | --- |
| Package | `@dsh-external/dsh-taffy-theme` |
| Version | **`0.2.0`** |
| 目标宿主 | **DSH Desktop 0.2.x**（`desktop` profile） |
| Requires | `engines.dsh`：`>=0.2.1-rc.2 <0.3.0` |
| 只改外观 | 不接管 DSH 原生按钮、事件与几何布局 |

> **0.2.x 单一版本线**：本版只支持 DSH `0.2.1-rc.2` 起的 0.2.x。0.1.x 宿主请使用旧版 Release。

## 装机

DSH Desktop 使用 `desktop` profile：

```bash
dsh plugin --profile desktop add https://raw.githubusercontent.com/lengzhanbao/dsh-taffy-theme/master/dist/dsh-external-dsh-taffy-theme-0.2.0.tgz
```

或下载仓库里的 `dist/dsh-external-dsh-taffy-theme-0.2.0.tgz` 后本地安装：

```powershell
dsh plugin --profile desktop add .\dsh-external-dsh-taffy-theme-0.2.0.tgz
```

装完 **完全退出并重开 DSH Desktop** —— 客户端 bundle 只在启动时加载，仅刷新窗口不够。

然后打开 **设置 → 通用 → 塔菲工房**。

## 素材：九套，全部可选

背景、侧栏水印、底部 Q 版各自独立设置，也可一键恢复默认。
**升级不会替换你正在用的画面** —— 已有配置一律保持原样，新素材只在你主动选择后生效。

### 背景（5 张，16:9）

| | | |
| --- | --- | --- |
| ![观星台](assets/taffy/backgrounds/observatory.webp) | ![星空露台](assets/taffy/backgrounds/balcony.webp) | ![星夜创作室](assets/taffy/backgrounds/studio.webp) |
| 观星台 | 星空露台 | 星夜创作室 |
| ![午夜工房](assets/taffy/backgrounds/atelier.webp) | ![星夜钢琴室](assets/taffy/backgrounds/piano.webp) | |
| 午夜工房 | 星夜钢琴室 | |

### 侧栏水印（2 张，9:16）

| | |
| --- | --- |
| ![星空侧栏](assets/taffy/sidebar/celestial-sidebar.webp) | ![梅色梦境](assets/taffy/sidebar/celestial-plum.webp) |
| 星空侧栏 | 梅色梦境 |

### 底部 Q 版（2 张，1:1）

| | |
| --- | --- |
| ![抱猫猫](assets/taffy/chibi/cat-hug.webp) | ![张开手](assets/taffy/chibi/open-arms.webp) |
| 抱猫猫 | 张开手 |

### 经典壁纸

升级前的两张原版壁纸**完整保留**，并且是**独立选项**（经典花房 / 经典舞台）——
浅色外观也能主动选深色舞台，反之亦然。

## 聊天外观（0.2.0 新增）

| 设置 | 可选项 |
| --- | --- |
| 我的消息气泡 | 原生 / 玻璃 / 华丽 |
| 气泡边框 | 无边框 / 细边 / 强调 |
| 气泡背景不透明度 · 圆角 · 最大宽度 | 滑块 |
| 输入框样式 | 原生 / 玻璃 / 华丽 |
| 输入框装饰强度 | 无装饰 / 简约 / 完整 |
| 输入框不透明度 · 圆角 | 滑块 |

- 气泡透明度**只作用于背景色**，不会让文字和按钮一起变淡。
- 输入框「完整」才绘制金色角饰；「简约」是细粉边；「无装饰」完全干净。
- 助手回复、工具卡片、代码块、Markdown 容器**不受影响**。

## 三档侧栏边框

| 档位 | 效果 |
| --- | --- |
| 关闭 | 不绘制任何边线 |
| 简约·柔光 | 一条粉紫细侧线 + 底部短柔光 |
| 完整·细框 | 左右香槟金细线 + 上下短线 |

三档都**不改动 DSH 原生按钮**的尺寸、图标、点击区域与事件；边框与侧栏水印互相独立。

## 与 DSH 的关系

- **不接管原生交互**：不为原生按钮换图标、改尺寸或加伪元素；仓库内有静态守卫测试
  （`tests/native-controls-untouched.test.ts`）防止回退。
- **锚点只用宿主稳定属性**：`[data-chat-flow-kind='user']`、`--dsw-specific-bubble`、
  `--dsw-radius-xl`、`--dsh-chat-content-width`，不使用会随构建变化的哈希类名。
- **`--dsw-*` token 限定在 DSH 列容器内**，亚克力效果 opt-in，降低误伤第三方插件风险。
- 架构思路参考 [maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier)，
  **未复制**其代码与资产。

## 验证边界

| 项目 | 状态 |
| --- | --- |
| 工程门禁 | `npm run ci` —— 192 项测试 + 打包/静态/依赖/预设门禁，全绿 |
| 桌面运行时装载 | 用桌面自带运行时安装、素材路由实测通过 |
| 渲染进程内视觉 | **需在真机确认** —— 设置页与聊天区需登录后才渲染 |
| Electron 内自动化取证 | 未做（单实例锁限制，见 `docs/DESKTOP-RUNTIME-EVIDENCE.md`） |

## 文档

| 文档 | 说明 |
| --- | --- |
| [安装指南](docs/install.zh.md) · [Install (EN)](docs/install.en.md) | 环境要求、自检、升级/卸载 |
| [使用说明](docs/usage.zh.md) · [Usage (EN)](docs/usage.en.md) | 各项设置的含义 |
| [兼容审计](docs/COMPAT-0.2.x-2026-10-19.md) | 0.2.x 适配依据 |
| [桌面运行时证据](docs/DESKTOP-RUNTIME-EVIDENCE.md) | 装载层与素材路由的实测记录 |
| [Astral Atelier 实现说明](docs/ASTRAL-ATELIER.md) | 配色、装饰预算、素材接入与已知限制 |
| [CHANGELOG](CHANGELOG.md) | 版本变更 |

## 卸载

```bash
dsh plugin --profile desktop remove @dsh-external/dsh-taffy-theme
```

完全退出并重开应用后，界面恢复 DSH 原生外观；残留样式节点会在卸载时清理。

## 开发者

```powershell
npm run build:ci     # 生成 theme-css.ts 并构建
npm run typecheck
npm run ci           # 全量门禁（含 192 项测试）
npm pack             # 出发布包
```

> 改了 CSS 后必须先 `build:ci` 再 `ci` —— 静态门禁会比对 `lib/client.js` 与源 CSS。

重装同版本号时 `plugin add` 可能复用旧解析结果，务必先 `remove` 再 `add`，
并用哈希核对实际安装的 `lib/client.js`。

## 素材与授权

- **源代码**：[MIT](LICENSE)
- **角色图像**：非官方同人 fan skin，详见 [NOTICE.md](NOTICE.md)

## English

A Taffy character theme built for the official **DSH Desktop** 0.2.x: nine selectable art packages
(five night-interior backdrops, two sidebar watermarks, two chibi mascots), a glass/ornate chat look
for your own messages and the composer, and three sidebar frame levels. It repaints the theme's own
layers only — native DSH controls keep their geometry, icons and click behaviour. Install with the
command above, then fully restart the app; see [docs/install.en.md](docs/install.en.md).
