#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CHECKOUT="${DSH_CHECKOUT:-E:/DeepSeekHarness/src/deepseek-harness}"
if [ ! -d "$CHECKOUT/packages" ]; then
  echo "build: DSH checkout not found at $CHECKOUT" >&2
  exit 1
fi

TSC="$CHECKOUT/node_modules/.bin/tsc"
if [ ! -x "$TSC" ] && [ ! -f "$TSC.cmd" ]; then
  TSC="$CHECKOUT/node_modules/typescript/bin/tsc"
fi

link_pkg() {
  local target="$CHECKOUT/$2"
  node -e "
    const fs = require('fs');
    const path = require('path');
    const link = path.resolve(process.argv[1]);
    const target = path.resolve(process.argv[2]);
    fs.rmSync(link, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  " "node_modules/$1" "$target"
}

mkdir -p node_modules/@deepseek-ai
link_pkg cordis vendor/cordis
link_pkg schemastery vendor/schemastery
link_pkg @deepseek-ai/dsh-tools packages/core/tools
link_pkg @deepseek-ai/dsh-settings packages/core/settings
link_pkg @deepseek-ai/dsh-agent-presets packages/preset/agent-presets
link_pkg @deepseek-ai/dsh-client-ui-slots packages/client/ui-slots
link_pkg @deepseek-ai/dsh-client-runtime packages/client/runtime
link_pkg @deepseek-ai/dsh-client-locale packages/client/locale
link_pkg @deepseek-ai/dsh-client-ui-theme packages/client/ui-theme
link_pkg @deepseek-ai/dsh-client-ui-settings packages/client/ui-settings
link_pkg @deepseek-ai/dsh-client-ui-settings-general packages/client/ui-settings-general

REACT_DIR=$(find "$CHECKOUT/node_modules/.pnpm" -maxdepth 1 -type d -iname 'react@18.3.1' 2>/dev/null | head -1)/node_modules/react
REACTDOM_DIR=$(find "$CHECKOUT/node_modules/.pnpm" -maxdepth 1 -type d -iname 'react-dom@18.3.1*' 2>/dev/null | head -1)/node_modules/react-dom
node -e "
  const fs = require('fs');
  const path = require('path');
  for (const [name, target] of process.argv.slice(1).map((p) => p.split('='))) {
    const link = path.resolve('node_modules', name);
    fs.rmSync(link, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(path.resolve(target), link, 'junction');
  }
" "react=$REACT_DIR" "react-dom=$REACTDOM_DIR"

"$TSC" -p tsconfig.json
echo "host build complete"
