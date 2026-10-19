# Installation (end users)

One command — **no** git clone, **no** local `npm build`.

## Requirements

| Item | Requirement |
| --- | --- |
| Platform | DSH **Web** profile or **Desktop** profile — see the profile note below |
| DSH version | decided by `engines.dsh`: `>=0.1.6-alpha.1 <0.2.0 \|\| >=0.2.1-rc.2 <0.3.0` |
| Other | DSH opens normally (`dsh web` defaults to `http://127.0.0.1:3080`; Desktop is an app window) |

> ⚠️ **Pick the right profile.** DSH Desktop uses `desktop`; browser DSH uses `web`. **Installing into the wrong profile does nothing.**
>
> **Verification status:** the `web` profile is install/start/browser-verified on DSH `0.2.1-rc.2` ([COMPAT-0.2.x-2026-10-19.md](COMPAT-0.2.x-2026-10-19.md)). The **`desktop` profile has not had a real install test yet** ([DESKTOP-AUDIT-2026-10-19.md](DESKTOP-AUDIT-2026-10-19.md)).
>
> CLI only is not supported — a theme is meaningless without the Web/Desktop UI.

## Install (recommended)

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.9/dsh-external-dsh-taffy-theme-0.1.9.tgz
```

Pinned version:

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.9/dsh-external-dsh-taffy-theme-0.1.9.tgz
```

Then:

1. **Restart** `dsh web`
2. **Hard-refresh** the browser (Ctrl+F5)
3. **Settings → General → Taffy mode** — master switch **On**

Light/dark follows DSH: **Settings → Appearance**.

## Quick checklist

- [ ] Wallpaper and pink-gold chat frame visible
- [ ] Taffy sliders in **Settings → General**
- [ ] Readable chat text (dark ink in light mode, warm gold-pink white in dark)
- [ ] Settings dialog opens and is clickable

## Optional persona

Skin and voice are **independent**. For Taffy speaking style, select agent preset **「Taffy 塔菲」**. See [usage.en.md](usage.en.md).

## Upgrade / uninstall

```bash
# upgrade
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/download/v0.1.9/dsh-external-dsh-taffy-theme-0.1.9.tgz
dsh web

# remove
dsh plugin --profile web remove @dsh-external/dsh-taffy-theme
dsh web
```

## FAQ

**No visual change** — Web profile only; hard-refresh; enable Taffy mode; avoid multiple UI themes.

**DSH won't start / JSON error** — Never hand-edit `profiles/web/package.json`; use `dsh plugin add`.

**Hard to read text** — Raise **Background veil** (14–18%) or **Panel opacity** in Taffy settings.

**After DSH upgrade, layout off** — Install the latest theme Release and report your DSH version if needed.

## Maintainers

See [environment-baseline.md](environment-baseline.md) and `npm run install:release` for pack smoke tests.
