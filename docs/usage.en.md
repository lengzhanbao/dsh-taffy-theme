# User Guide

> **First install?** See [install.en.md](install.en.md) (one command, no build).

## Quick start

1. Install the plugin (see [README](../README.md))
2. Refresh DSH Web
3. Open **Settings → General → Taffy mode** to tune the skin
4. (Optional) Select agent preset **「Taffy 塔菲」** for the Taffy speaking style

Skin and persona are independent: turning off Taffy mode only affects the UI.

---

## Light and dark

There is **no separate day/night toggle** in this theme. It follows DSH globally:

**Settings → Appearance → Light / Dark / System**

| Item | Light | Dark |
| --- | --- | --- |
| Stage wallpaper | Sunlit conservatory | Neon concert stage |
| Side portraits | Casual poses | Stage / formal outfits |
| Panels & veil | Warm translucent mix | Deep purple mix, soft pink-gold glow on buttons |
| Agent state colors | Pink / lavender / lens tokens | Same palette, dark phase |

---

## Opacity and display

Path: **Settings → General → Taffy mode**

Stored in browser `localStorage` (`dsh-taffy-theme:v1`). Defaults restore on uninstall. All sliders are **0–100%** and apply immediately.

| Setting | Default | What it does |
| --- | ---: | --- |
| Taffy mode | On | Master switch — off hides all chrome |
| Frame opacity | 85% | Pink-gold border around the chat area |
| Panel opacity | 82% | Sidebar, chat column, composer backgrounds |
| Background veil | 10% | Wash over wallpaper — higher = easier to read |
| Acrylic opacity | 70% | Only acrylic-marked surfaces |
| Cheer mascot | On | Chibi mascot in the sidebar |
| Portrait opacity | 100% | Overall opacity for portraits and mascot |
| Reduced motion | Off | Disables looping glows and breathe animations |

### Tips

- Busy background → raise **Background veil** to 14%–18%
- Flat composer → slightly raise **Panel opacity**
- More art visible → lower **Background veil** or disable **Cheer mascot**
- Strong dark glow → enable **Reduced motion** and raise **Background veil** slightly

Acrylic is **opt-in only** — other plugins are not frosted by default.

---

## Taffy agent preset

Select preset **「Taffy 塔菲」** in your session. Built on the standard tool set.

### Persona

The model plays **Taffy (永雏塔菲)** — Welsh ace detective-inventor and virtual idol, also a technical assistant:

- Pink hair, golden eyes, 148 cm, stubborn ahoge
- Cheerful; fans are **雏草姬**
- Catchphrases appear occasionally, not every sentence
- From 1885 via a late time machine; companions 小皮 and 菲球

### Voice

- “Meow” (喵) is occasional seasoning, not every technical line
- Light cute particles when appropriate
- Direct answers when you ask for brevity or the topic is serious

### When coding

- Admits uncertainty instead of inventing paths, logs, or tool output
- General: conclusion → why → steps → verify
- Code: locate → root cause → minimal fix → test → risks
- No leaking secrets

Example:

> taffy is 永雏塔菲, ace detective-inventor from Wales. taffy will help 雏草姬 write code properly, meow. 关注永雏塔菲谢谢喵！

Preset files ship inside the plugin under `presets/taffy/`.

---

## Assets and license

| Content | License |
| --- | --- |
| Plugin source code | [MIT](../LICENSE) |
| Wallpapers, portraits, Q-icons | Unofficial fan art for UI display only |

**Important:**

1. **Not** an official product; **no** claim of authorization from rights holders  
2. **Do not** extract, commercialize, or redistribute character art separately  
3. Rights holders may [open an issue](https://github.com/lengzhanbao/dsh-taffy-theme/issues); we will remove assets upon verified request  

Architecture studied from [maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier); no code or assets copied. See [NOTICE.md](../NOTICE.md).

---

## Known limits

- **Web profile only**
- UI theme only — does not alter sessions, models, or host logic
- End users: install the Release `.tgz` ([install.en.md](install.en.md))
- After a major DSH upgrade, install the latest theme Release
