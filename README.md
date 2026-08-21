# Taffy Live Atelier / 塔菲直播工房

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

**Package:** `@dsh-external/dsh-taffy-theme`  
**Type:** DSH Web UI theme + Taffy agent preset  
**Version:** 0.1.0  
**Compatible with:** DeepSeek Harness `0.1.0-rc.6` (Web profile, port 3080)  
**License:** MIT (code) · unofficial fan art for bundled images — see [NOTICE.md](NOTICE.md)

A candy-pink / gold **acrylic** theme for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web. Light and dark follow DSH appearance. Stage wallpaper, framed chat, side portraits, and Q-face chrome are bundled locally (no CDN).

面向 DeepSeek Harness Web 的塔菲风格主题：浅色/深色舞台、粉金对话框、左右立绘与 Q 版按钮图标，资源全部本地打包。

## Screenshots / 功能截图

### Light / 浅色

![Taffy Live Atelier light mode](preview/light.webp)

### Dark / 深色

![Taffy Live Atelier dark mode](preview/dark.webp)

## Install / 安装

Use the GitHub repo URL or a Release tarball. Do **not** pass a bare folder name (DSH treats that as an npm package).

请用仓库地址或 Release 包，不要只写目录名。

```bash
# from GitHub (after the repo is public)
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme.git

# from a prebuilt Release (recommended — skips source rebuild)
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.0.tgz
```

Then refresh Web (`http://127.0.0.1:3080`). Confirm Settings → General shows **Taffy mode / Taffy 模式**.

刷新网页后，在「设置 → 通用」里应看到 **Taffy 模式**。

## Uninstall / 卸载

```bash
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
```

Refresh Web. Chrome, CSS node `#dsh-taffy-theme-style`, and `body[data-dsh-taffy-theme]` should be gone. Native DSH layout returns.

刷新后主题装饰与样式节点应消失，官方界面恢复。

## Settings / 设置项

Stored in `localStorage` key `dsh-taffy-theme:v1`.

| Setting | 设置 | What it does |
| --- | --- | --- |
| Taffy mode on/off | 开启 / 关闭 | Enables or disables the theme chrome |
| Frame opacity | 边框透明度 | Pink-gold chat frame |
| Panel opacity | 面板透明度 | Native pane mix |
| Veil | 背景纱 | Stage wash over wallpaper |
| Acrylic | 亚克力透明度 | Opt-in acrylic surfaces only |
| Left / right portrait | 左侧 / 右侧 | Side characters |
| Mascot | 加油喵 | Sidebar cheer mascot |
| Character opacity | 立绘透明度 | Portrait strength |
| Reduced motion | 减弱动效 | Cuts looping glows |

Light/dark follows DSH **Appearance**. For Taffy speaking style, pick the **Taffy 塔菲** agent preset.

浅色/深色跟随 DSH「外观」。塔菲口吻请在 Agent 预设里选 **Taffy 塔菲**。

## Assets / 素材来源

| Path | Use |
| --- | --- |
| `assets/taffy/` | Local wallpapers, portraits, Q-face icons |
| `preview/` | README / market screenshots |
| `presets/taffy/` | Agent preset |

No remote image URLs. See `assets/taffy/LICENSE.txt` and [NOTICE.md](NOTICE.md).

## Known limits / 已知限制

- Web profile only (`dsh.client.platform: web`).
- Presentation-only: does not change conversation, model, or host logic.
- Acrylic is opt-in (`data-taffy-surface='acrylic'`). Other plugins stay unstyled.
- Source rebuild (`npm run build`) currently expects a local DSH checkout via `DSH_CHECKOUT`. Install from the Release `.tgz` if you are not developing the plugin.
- Unofficial Taffy likeness. Not an official product.

## License

- **Code:** [MIT](LICENSE)
- **Architecture reference:** maid-atelier (not copied) — [NOTICE.md](NOTICE.md)
- **Character art:** unofficial fan use; original rights holders retain character IP

## Topics / 检索标签

GitHub topics for search: `dsh-plugin`, `dsh`, `deepseek-harness`, `theme`, `ui`, `taffy`.

awesome-dsh-plugin category: **theme** (Themes & Appearance).
