# Contributing

## End users

**Do not clone the repo.** Install the prebuilt Release:

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.1.tgz
dsh web
```

Full guide: [docs/install.zh.md](docs/install.zh.md) · [docs/install.en.md](docs/install.en.md)

## Developers

1. Clone this repository
2. Node.js 18+
3. Set `DSH_CHECKOUT` to a local [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) checkout

```powershell
$env:DSH_CHECKOUT = "E:\DeepSeekHarness\src\deepseek-harness"
$env:DSH_HOME = "E:\DeepSeekHarness"
npm install
npm run build
npm test
npm run install:dev   # link into profiles/web
dsh web
```

**Never** hand-edit `profiles/web/package.json` — use `dsh plugin add` or `npm run install:dev` / `install:release`.

## Verify before publishing

```bash
npm test
npm run verify:static
npm run verify:assets
npm run verify:pack
npm run install:release
```

Release steps: [docs/release-checklist.md](docs/release-checklist.md)

Confirm `lib/client.js` registers as `@dsh-external/dsh-taffy-theme` (no `@file:` prefix in published tarball).
