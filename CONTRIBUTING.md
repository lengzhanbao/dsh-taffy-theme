# Contributing

This is a DeepSeek Harness **Web UI theme** plugin (`@dsh-external/dsh-taffy-theme`).

## Topics

Please keep GitHub topics: `dsh-plugin`, `dsh`, `deepseek-harness`, `theme`, `ui`, `taffy`.

`dsh-plugin` is required for [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) and in-session find-plugin search.

## Tests

```bash
npm test
npm run build
npm pack --dry-run
```

Confirm `lib/client.js` module id is `@dsh-external/dsh-taffy-theme` (no `@file:` prefix).

## Market listing

Copy `docs/market/lengzhanbao__dsh-taffy-theme.yml` into a PR on `awesome-dsh-plugin/awesome-dsh-plugin` under `data/plugins/`. Category is `theme`. The list requires the GitHub repo to be at least 1 day old with 10+ commits.
