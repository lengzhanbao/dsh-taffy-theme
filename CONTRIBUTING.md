# Contributing

## End users

Install the prebuilt Release — no build step required:

```bash
dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.0.tgz
```

## Developers

1. Clone this repository
2. Install Node.js 18+
3. Point `DSH_CHECKOUT` at a local [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) checkout (the folder that contains `packages/`)

```powershell
$env:DSH_CHECKOUT = "C:\path\to\deepseek-harness"
npm install
npm run build
npm test
```

## Verify before publishing

```bash
npm test
npm run build
npm pack --dry-run
```

Confirm `lib/client.js` registers as `@dsh-external/dsh-taffy-theme` (no `@file:` prefix).
