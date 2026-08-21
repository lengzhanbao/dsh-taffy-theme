# Taffy Live Atelier / 塔菲直播工房

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

粉金亚克力 **DSH Web 主题** — 浅色/深色舞台立绘、可调透明层，以及可选的 **Taffy 塔菲** Agent 预设。

| | |
| --- | --- |
| Package | `@dsh-external/dsh-taffy-theme` |
| Version | `0.1.0` |
| Platform | DSH Web |
| Requires | DeepSeek Harness `0.1.0-rc.6`+ (Web profile) |

## 简介

**Taffy Live Atelier** 为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 提供虚拟直播工房式界面：花房/舞台壁纸、粉金对话框边框、塔菲 Q 版按钮、左右立绘。资源全部本地打包，不依赖 CDN；仅修改外观，不影响对话逻辑与其他插件。

- 详细说明（中文）：[docs/usage.zh.md](docs/usage.zh.md)
- User guide (English): [docs/usage.en.md](docs/usage.en.md)

## 截图

| 浅色 Light | 深色 Dark |
| --- | --- |
| ![Light](preview/light.webp) | ![Dark](preview/dark.webp) |

## 安装

```bash
# 推荐：预构建 Release
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.0.tgz

# 或从仓库安装
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme.git
```

刷新 DSH Web 页面。打开 **设置 → 通用** 可看到 **Taffy 模式**。

## 卸载

```bash
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
```

刷新页面后界面恢复默认。

## 素材与授权

- **源代码**：[MIT](LICENSE)
- **角色图像**：非官方同人 fan skin；**不声称**获得官方或权利人授权；**不得**将素材单独商用或再分发
- 权利人若认为侵权，请通过 [GitHub Issues](https://github.com/lengzhanbao/dsh-taffy-theme/issues) 联系，核实后将下架相关素材

详见 [NOTICE.md](NOTICE.md)。

## English

Candy-pink acrylic theme for DSH Web with light/dark stage art and an optional Taffy agent preset. Install with the commands above, then see [docs/usage.en.md](docs/usage.en.md) for settings and persona details.
