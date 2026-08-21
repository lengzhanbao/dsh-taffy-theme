$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Checkout = $env:DSH_CHECKOUT
if ([string]::IsNullOrWhiteSpace($Checkout)) {
  throw @"
DSH_CHECKOUT is not set.

End users: install the prebuilt Release .tgz — no build required.
Developers: set DSH_CHECKOUT to your deepseek-harness checkout (folder containing packages/).

  `$env:DSH_CHECKOUT = 'C:\path\to\deepseek-harness'
"@
}
if (-not (Test-Path "$Checkout\packages")) {
  throw "DSH checkout not found or invalid: $Checkout (expected packages\ subdirectory)"
}

function Link-Package($name, $target) {
  $link = Join-Path $Root "node_modules\$name"
  $parent = Split-Path $link -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  if (Test-Path $link) { Remove-Item $link -Recurse -Force }
  cmd /c mklink /J "$link" "$target" | Out-Null
}

New-Item -ItemType Directory -Force -Path "$Root\node_modules\@deepseek-ai" | Out-Null
Link-Package 'cordis' "$Checkout\vendor\cordis"
Link-Package 'schemastery' "$Checkout\vendor\schemastery"
Link-Package '@deepseek-ai\dsh-tools' "$Checkout\packages\core\tools"
Link-Package '@deepseek-ai\dsh-settings' "$Checkout\packages\core\settings"
Link-Package '@deepseek-ai\dsh-agent-presets' "$Checkout\packages\preset\agent-presets"
Link-Package '@deepseek-ai\dsh-client-ui-slots' "$Checkout\packages\client\ui-slots"
Link-Package '@deepseek-ai\dsh-client-runtime' "$Checkout\packages\client\runtime"
Link-Package '@deepseek-ai\dsh-client-locale' "$Checkout\packages\client\locale"
Link-Package '@deepseek-ai\dsh-client-ui-theme' "$Checkout\packages\client\ui-theme"
Link-Package '@deepseek-ai\dsh-client-ui-settings' "$Checkout\packages\client\ui-settings"
Link-Package '@deepseek-ai\dsh-client-ui-settings-general' "$Checkout\packages\client\ui-settings-general"

$reactDir = Get-ChildItem "$Checkout\node_modules\.pnpm" -Directory -Filter 'react@18.3.1' | Select-Object -First 1
$reactDomDir = Get-ChildItem "$Checkout\node_modules\.pnpm" -Directory -Filter 'react-dom@18.3.1*' | Select-Object -First 1
if ($reactDir) { Link-Package 'react' "$($reactDir.FullName)\node_modules\react" }
if ($reactDomDir) { Link-Package 'react-dom' "$($reactDomDir.FullName)\node_modules\react-dom" }

$Tsc = "$Checkout\node_modules\typescript\bin\tsc"
if (-not (Test-Path $Tsc)) { $Tsc = "$Checkout\node_modules\.bin\tsc.cmd" }

node -e @"
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const css = [
  'export const tokensCss = ' + JSON.stringify(read('src/theme/tokens.css')) + ';',
  'export const surfacesCss = ' + JSON.stringify(read('src/theme/taffy-surfaces.css')) + ';',
  'export const badgesCss = ' + JSON.stringify(read('src/theme/taffy-badges.css')) + ';',
  'export const componentsCss = ' + JSON.stringify(read('src/theme/components.css')) + ';',
  'export const motionCss = ' + JSON.stringify(read('src/theme/motion.css')) + ';',
].join('\n');
fs.writeFileSync(path.join(root, 'src/client/theme-css.ts'), css);
"@

& node $Tsc -p tsconfig.host.json
if ($LASTEXITCODE -ne 0) { throw 'host tsc failed' }
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'lib\prompt') | Out-Null
Copy-Item (Join-Path $Root 'src\prompt\taffy-system.md') (Join-Path $Root 'lib\prompt\taffy-system.md') -Force
& node (Join-Path $Root 'scripts\sync-persona.mjs')
Write-Host 'host build complete'
