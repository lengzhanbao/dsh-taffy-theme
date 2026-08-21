# Taffy Live Atelier / 塔菲直播工房

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

**DeepSeek Harness Web 主题插件** — 粉金亚克力界面、浅色/深色舞台立绘、可调的透明层，以及可选的 **Taffy 塔菲** Agent 预设。

| | |
| --- | --- |
| 包名 | `@dsh-external/dsh-taffy-theme` |
| 版本 | `0.1.0` |
| 平台 | DSH Web |
| 兼容 | DeepSeek Harness `0.1.0-rc.6` 及以上 Web profile |
| 许可 | 代码 [MIT](LICENSE) · 角色素材为同人用途，见 [NOTICE.md](NOTICE.md) |

---

## 这是什么

**Taffy Live Atelier（塔菲直播工房）** 把 DSH Web 变成一套「虚拟直播工房」界面：

- **浅色模式**：阳光花房舞台、左右立绘、粉金对话框边框  
- **深色模式**：霓虹舞台聚光灯、钢琴场景、暗色亚克力面板  
- **Q 版图标**：发送、停止、新会话、设置等按钮换成塔菲头像  
- **本地资源**：壁纸、立绘、图标全部打包在插件内，不拉 CDN  
- **只动皮肤**：不改对话逻辑、模型选择或宿主 API；其他插件默认不被亚克力覆盖  

附带 **Taffy 塔菲** Agent 预设：在保留完整编码工具的前提下，用永雏塔菲的口吻协助你写代码（见下文）。

---

## 截图

### 浅色

花房背景、左右立绘、半透明输入区与粉金外框。

![浅色模式](preview/light.webp)

### 深色

舞台灯光、暗色面板、立绘与钢琴场景。

![深色模式](preview/dark.webp)

---

## 安装

请使用 **GitHub 仓库地址** 或 **Release 安装包**（不要只写文件夹路径）。

```bash
# 推荐：预构建包，安装最快
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.0.tgz

# 或从仓库安装
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme.git
```

安装后刷新 DSH Web 页面，打开 **设置 → 通用**，应能看到 **Taffy 模式** 设置区。

## 卸载

```bash
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
```

刷新页面后，主题装饰与样式会完全移除，界面恢复为 DSH 默认外观。

---

## 使用说明

### 浅色与深色

主题**没有**单独的日夜开关，跟随 DSH 全局外观：

**设置 → 外观 → 浅色 / 深色 / 跟随系统**

切换外观后，插件会自动更换：

| 项目 | 浅色 | 深色 |
| --- | --- | --- |
| 舞台壁纸 | 花房日光 | 霓虹舞台 |
| 左右立绘 | 坐姿日常装 | 舞台/礼服造型 |
| 面板与纱幕 | 暖色半透明 | 深紫半透明，按钮带轻微粉金光晕 |
| Agent 状态色 | 粉 / 薰衣草 / _lens 配色 | 同系列深色相位 |

### 透明度与显示

在 **设置 → 通用 → Taffy 模式** 中调节（保存在浏览器本地，卸载后恢复默认）。

| 设置项 | 默认值 | 说明 |
| --- | ---: | --- |
| Taffy 模式 | 开启 | 总开关。关闭后隐藏全部皮肤装饰 |
| 边框透明度 | 85% | 对话区粉金外框的可见度 |
| 面板透明度 | 82% | 侧栏、对话区、输入框底色的混合强度 |
| 背景纱 | 10% | 壁纸上的半透明幕布，数值越高文字越易读 |
| 亚克力透明度 | 70% | 仅影响标记为亚克力的表面，不波及其他插件 |
| 左侧立绘 | 开启 | 画面左侧大立绘 |
| 右侧立绘 | 开启 | 画面右侧立绘（会随浮层收缩） |
| 加油喵 | 开启 | 侧栏底部 Q 版 mascot |
| 立绘透明度 | 100% | 上述立绘与 mascot 的整体不透明度 |
| 减弱动效 | 关闭 | 开启后关闭循环光晕、呼吸动画等 |

**常用调节：**

- 背景太花、字看不清 → 把 **背景纱** 调到 14%–18%  
- 对话框发灰 → 略提高 **面板透明度**  
- 想多看立绘 → 降低 **背景纱**，或关掉 **加油喵** 减少遮挡  
- 深色下光晕太亮 → 开启 **减弱动效**，并略升 **背景纱**

亚克力效果是 **按需启用** 的：只有显式声明亚克力的节点才会磨砂，不会把整个界面或其他插件都糊一层。

### Taffy 塔菲预设（可选）

皮肤与说话方式是两件事：

- **Taffy 模式**：只控制界面外观  
- **Agent 预设「Taffy 塔菲」**：控制模型怎么说话  

要使用塔菲口吻，请在会话里选择预设 **「Taffy 塔菲」**。预设基于标准工具集，不削弱编码能力。

#### 角色设定

模型会扮演 **永雏塔菲** —— 设定上的威尔士王牌侦探发明家，也是虚拟偶像；在 DSH 里同时是靠谱的技术助手：

- 粉发金瞳，148cm，头上有一根压不下去的呆毛  
- 活泼、调皮，粉丝称呼 **雏草姬**  
- 偶尔会说「关注永雏塔菲喵」「塔不灭」，但**不会每句话都加喵**  
- 来自 1885 年，乘时光机「迟到」来到现在；伙伴有小皮、菲球  

#### 说话方式

- 「喵」只在撒娇、强调或口头禅时出现，正常讲技术时不滥用  
- 可以轻度使用呀、哒、啦、嘻嘻、贴贴  
- 当你要求简洁或问题很严肃时，会立刻收起玩梗，直接给结论和步骤  

#### 写代码时

- 不知道就说不知道，不编造文件路径、日志或工具输出  
- 普通问题：结论 → 原因 → 步骤 → 如何验证  
- 代码问题：定位 → 根因 → 尽量小的改动 → 测试 → 风险说明  
- 不泄露密钥或隐私信息  

示例自我介绍：

> 我是永雏塔菲呀，威尔士来的王牌侦探发明家，也是雏草姬的虚拟偶像。在这里我会好好帮你写代码的喵。

---

## 素材与授权

- 壁纸、立绘、Q 版图标位于 `assets/taffy/`，构建时内嵌进客户端包  
- Agent 预设与 system prompt 位于 `presets/taffy/`  
- 本主题为 **非官方同人皮肤**，角色版权归原权利人所有  
- 详情见 [NOTICE.md](NOTICE.md) 与 `assets/taffy/LICENSE.txt`

## 已知限制

- 仅支持 DSH **Web** 端，不支持 CLI / 其他 profile  
- 纯 UI 主题，不修改会话存储、模型路由或插件宿主逻辑  
- 需要自行从 Release 或 GitHub 安装；安装后刷新页面即可生效  

---

# English

**A DeepSeek Harness Web theme** — candy-pink acrylic chrome, light/dark stage portraits, adjustable transparency layers, and an optional **Taffy** agent preset.

| | |
| --- | --- |
| Package | `@dsh-external/dsh-taffy-theme` |
| Version | `0.1.0` |
| Platform | DSH Web |
| Requires | DeepSeek Harness `0.1.0-rc.6` or newer (Web profile) |
| License | Code [MIT](LICENSE) · fan art for character assets — see [NOTICE.md](NOTICE.md) |

## What it is

**Taffy Live Atelier** turns the DSH Web UI into a virtual-streamer stage:

- **Light mode** — sunlit conservatory stage, side portraits, pink-gold chat frame  
- **Dark mode** — neon spotlight stage, piano scene, dark acrylic panels  
- **Q-face icons** — send, stop, new session, and settings use Taffy headshots  
- **Bundled assets** — wallpapers, portraits, and icons ship inside the plugin (no CDN)  
- **Presentation only** — does not change chat logic, model routing, or host APIs; acrylic does not blanket other plugins by default  

Also includes a **Taffy** agent preset: full coding tools, with an optional Taffy persona (see below).

## Screenshots

### Light

Conservatory backdrop, side characters, translucent composer, pink-gold frame.

![Light mode](preview/light.webp)

### Dark

Stage lighting, dark panels, portraits and piano scene.

![Dark mode](preview/dark.webp)

## Install

Use the **GitHub repo URL** or a **Release tarball** (do not pass a bare folder path).

```bash
# Recommended: prebuilt Release (fastest)
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.0.tgz

# Or install from the repository
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme.git
```

Refresh the DSH Web page. Open **Settings → General** — you should see the **Taffy mode** panel.

## Uninstall

```bash
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
```

Refresh the page. All theme chrome and styles are removed; the native DSH UI returns.

## Usage

### Light and dark

There is **no separate day/night toggle** in this theme. It follows DSH globally:

**Settings → Appearance → Light / Dark / System**

When appearance changes, the plugin swaps:

| Item | Light | Dark |
| --- | --- | --- |
| Stage wallpaper | Sunlit conservatory | Neon concert stage |
| Side portraits | Casual seated poses | Stage / formal outfits |
| Panels & veil | Warm translucent mix | Deep purple mix, soft pink-gold button glow |
| Agent state colors | Pink / lavender / lens tokens | Same palette, dark phase |

### Opacity and display

Adjust under **Settings → General → Taffy mode** (stored in browser local storage; defaults restore on uninstall).

| Setting | Default | What it does |
| --- | ---: | --- |
| Taffy mode | On | Master switch — off hides all skin chrome |
| Frame opacity | 85% | Pink-gold border around the chat area |
| Panel opacity | 82% | Sidebar, chat column, and composer background mix |
| Background veil | 10% | Wash over the wallpaper — higher = easier to read text |
| Acrylic opacity | 70% | Only surfaces marked as acrylic; other plugins untouched |
| Left portrait | On | Large character on the left |
| Right portrait | On | Character on the right (shrinks with floating panels) |
| Cheer mascot | On | Chibi mascot at the bottom of the sidebar |
| Portrait opacity | 100% | Overall opacity for portraits and mascot |
| Reduced motion | Off | Disables looping glows and breathe animations |

**Tips:**

- Busy background, hard to read → raise **Background veil** to 14%–18%  
- Composer looks flat → slightly raise **Panel opacity**  
- Want more art visible → lower **Background veil**, or turn off **Cheer mascot**  
- Dark mode glow too strong → enable **Reduced motion** and raise **Background veil** slightly  

Acrylic is **opt-in only** — only nodes that declare acrylic get the frosted effect.

### Taffy agent preset (optional)

Skin and speaking style are separate:

- **Taffy mode** — UI appearance only  
- **Agent preset “Taffy 塔菲”** — how the model talks  

Select preset **「Taffy 塔菲」** in your session for the Taffy voice. Built on the standard tool set — no loss of coding capability.

#### Persona

The model plays **Taffy (永雏塔菲)** — a Welsh ace detective-inventor and virtual idol who is also a reliable technical assistant in DSH:

- Pink hair, golden eyes, 148 cm, one stubborn ahoge  
- Cheerful and playful; fans are called **雏草姬**  
- Catchphrases like “follow Taffy meow!” appear **occasionally**, not every sentence  
- From 1885, arrived late via time machine; companions include 小皮 and 菲球  

#### Voice

- “Meow” (喵) is seasoning — used when cute or emphatic, not in every technical sentence  
- Light particles: 呀, 啦, 嘻嘻, etc.  
- When you ask for brevity or the topic is serious, the persona steps back and gives direct answers  

#### When coding

- Says “I don’t know” instead of inventing paths, logs, or tool output  
- General questions: conclusion → why → steps → how to verify  
- Code issues: locate → root cause → minimal fix → test → risks  
- No leaking secrets or private data  

Example intro:

> I’m Taffy, ace detective-inventor from Wales and virtual idol for 雏草姬. I’ll help you write code properly, meow.

## Assets and license

- Wallpapers, portraits, and Q-icons live under `assets/taffy/` and are embedded in the client bundle  
- Agent preset and system prompt live under `presets/taffy/`  
- **Unofficial fan skin** — character IP remains with the rights holders  
- See [NOTICE.md](NOTICE.md) and `assets/taffy/LICENSE.txt`

## Known limits

- **Web profile only** — not CLI or other profiles  
- UI theme only — does not alter session storage, model routing, or host plugin logic  
- Install from Release or GitHub, then refresh the page
