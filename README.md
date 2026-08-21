# Taffy Live Atelier / 塔菲直播工房

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

粉金亚克力 **DSH Web 主题** — 浅色/深色舞台立绘、可调透明层，以及可选的 **Taffy 塔菲** Agent 预设。

| | |
| --- | --- |
| Package | `@dsh-external/dsh-taffy-theme` |
| Version | `0.1.1` |
| Platform | DSH **Web** profile only |
| Requires | DeepSeek Harness `0.1.0-rc.6`+ |

## 下载即用

**普通用户只需一条命令，无需克隆仓库或本地构建。**

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.1.tgz
dsh web
```

然后：**设置 → 通用 → Taffy 模式** 打开总开关，浏览器 **硬刷新**（Ctrl+F5）。

| 文档 | 说明 |
| --- | --- |
| [安装指南（中文）](docs/install.zh.md) | 环境要求、自检清单、FAQ、升级/卸载 |
| [Install guide (EN)](docs/install.en.md) | Same for English |
| [使用说明](docs/usage.zh.md) | 透明度、预设、素材声明 |
| [CHANGELOG](CHANGELOG.md) | 版本变更 |

## 截图

| 浅色 Light | 深色 Dark |
| --- | --- |
| ![Light](preview/light.webp) | ![Dark](preview/dark.webp) |

## 简介

**Taffy Live Atelier** 为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 提供虚拟直播工房式界面：花房/舞台壁纸、粉金对话框边框、塔菲 Q 版按钮、左右立绘。资源全部本地打包，不依赖 CDN；**仅修改外观**，不影响对话逻辑与其他插件。

- 架构思路参考 [maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier)，**未复制**其代码与资产
- `--dsw-*` token 限定在 DSH 列容器内；亚克力 **opt-in**，降低误伤第三方插件风险

## 稳定性说明（0.1.1）

| 面向 | 说明 |
| --- | --- |
| 普通用户 | Release `.tgz` 安装；发版前 `verify:pack` + 本地 profile 冒烟 |
| 已知边界 | 依赖 DSH Web DOM；DSH 大版本升级后请装最新 Release |
| 维护者 | `npm test` + `verify:*` 门禁；见 [release-checklist.md](docs/release-checklist.md) |

## 卸载

```bash
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
```

刷新页面后界面恢复默认。

## 开发者

```powershell
# 本地 link 到 3080（仅开发）
npm run install:dev
dsh web

# 生产式 pack 冒烟（发版前推荐）
npm run install:release
```

详见 [environment-baseline.md](docs/environment-baseline.md)、[rollback.md](docs/rollback.md)。

**切勿**手改 `profiles/web/package.json`（UTF-8 BOM 会导致 DSH 无法启动）。

## 素材与授权

- **源代码**：[MIT](LICENSE)
- **角色图像**：非官方同人 fan skin；详见 [NOTICE.md](NOTICE.md)

## English

Candy-pink acrylic theme for DSH Web. Install with the command above, then see [docs/install.en.md](docs/install.en.md) and [docs/usage.en.md](docs/usage.en.md).
