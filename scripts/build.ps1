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
  # A missing target used to produce a dangling junction silently, because the
  # mklink exit code was piped into Out-Null. Fail loudly instead: a broken link
  # only surfaces much later as a confusing module-resolution error.
  if (-not (Test-Path $target)) {
    throw "Link-Package: target missing for '$name' -> '$target' (is DSH_CHECKOUT correct?)"
  }
  $link = Join-Path $Root "node_modules\$name"
  $parent = Split-Path $link -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  if (Test-Path $link) { Remove-Item $link -Recurse -Force }
  cmd /c mklink /J "$link" "$target" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Link-Package: mklink failed ($LASTEXITCODE) for '$name' -> '$target'" }
  # A dangling junction is still "created"; verify it resolves.
  if (-not (Test-Path $link)) { throw "Link-Package: link does not resolve for '$name' -> '$target'" }
}

New-Item -ItemType Directory -Force -Path "$Root\node_modules\@deepseek-ai" | Out-Null
Link-Package 'cordis' "$Checkout\vendor\cordis"
Link-Package 'schemastery' "$Checkout\vendor\schemastery"
Link-Package '@deepseek-ai\dsh-tools' "$Checkout\packages\core\tools"
Link-Package '@deepseek-ai\dsh-settings' "$Checkout\packages\core\settings"

# The checkout layout is not guaranteed, so locate the remaining packages by
# name instead of hard-coding a path that silently produces a dangling link.
function Find-PackageDir($leaf) {
  $hit = Get-ChildItem "$Checkout\packages" -Directory -Recurse -Depth 3 -Filter $leaf -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($hit) { return $hit.FullName }
  return $null
}

# 0.2.x renamed the preset package to the singular; support both layouts.
$agentPreset = Find-PackageDir 'agent-preset'
if ($agentPreset) {
  Link-Package '@deepseek-ai\dsh-agent-preset' $agentPreset
} else {
  $agentPreset = Find-PackageDir 'agent-presets'
  if ($agentPreset) {
    Link-Package '@deepseek-ai\dsh-agent-presets' $agentPreset
  } else {
    Write-Warning "build.ps1: no agent-preset(s) package in the checkout; skipping the preset link"
  }
}

# The theme's asset route depends on this service for `ctx.webServer`.
$hostWebserver = Find-PackageDir 'webserver'
if ($hostWebserver) { Link-Package '@deepseek-ai\dsh-host-webserver' $hostWebserver }
else { Write-Warning "build.ps1: host webserver package not found; the asset route may not typecheck" }

$uiSlots = Find-PackageDir 'ui-slots'
if ($uiSlots) { Link-Package '@deepseek-ai\dsh-client-ui-slots' $uiSlots }
if (Test-Path "$Checkout\packages\client\ui-renderer") {
  Link-Package '@deepseek-ai\dsh-client-ui-renderer' "$Checkout\packages\client\ui-renderer"
} elseif (Test-Path "$Checkout\packages\client\runtime") {
  Link-Package '@deepseek-ai\dsh-client-runtime' "$Checkout\packages\client\runtime"
}
Link-Package '@deepseek-ai\dsh-client-locale' "$Checkout\packages\client\locale"
Link-Package '@deepseek-ai\dsh-client-ui-theme' "$Checkout\packages\client\ui-theme"
Link-Package '@deepseek-ai\dsh-client-ui-settings' "$Checkout\packages\client\ui-settings"
Link-Package '@deepseek-ai\dsh-client-ui-settings-general' "$Checkout\packages\client\ui-settings-general"

$reactDir = Get-ChildItem "$Checkout\node_modules\.pnpm" -Directory -Filter 'react@18.3.1' | Select-Object -First 1
$reactDomDir = Get-ChildItem "$Checkout\node_modules\.pnpm" -Directory -Filter 'react-dom@18.3.1*' | Select-Object -First 1
if ($reactDir) { Link-Package 'react' "$($reactDir.FullName)\node_modules\react" }
if ($reactDomDir) { Link-Package 'react-dom' "$($reactDomDir.FullName)\node_modules\react-dom" }

node -e @"
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const css = [
  'export const tokensCss = ' + JSON.stringify(read('src/theme/tokens.css')) + ';',
  'export const surfacesCss = ' + JSON.stringify(read('src/theme/taffy-surfaces.css')) + ';',
  'export const badgesCss = ' + JSON.stringify(read('src/theme/taffy-badges.css')) + ';',
  'export const componentsCss = ' + JSON.stringify(read('src/theme/components.css')) + ';',
  'export const motionCss = ' + JSON.stringify(read('src/theme/motion.css')) + ';',
].join('\n');
fs.writeFileSync(path.join(root, 'src/client/theme-css.ts'), css);
"@

$TscJs = Join-Path $Root 'node_modules\typescript\bin\tsc'
$TscCheckoutJs = "$Checkout\node_modules\typescript\bin\tsc"
$TscCmd = Join-Path $Root 'node_modules\.bin\tsc.cmd'
$TscCheckoutCmd = "$Checkout\node_modules\.bin\tsc.cmd"
if (Test-Path $TscJs) {
  & node $TscJs -p tsconfig.host.json
} elseif (Test-Path $TscCheckoutJs) {
  & node $TscCheckoutJs -p tsconfig.host.json
} elseif (Test-Path $TscCmd) {
  & $TscCmd -p tsconfig.host.json
} elseif (Test-Path $TscCheckoutCmd) {
  & $TscCheckoutCmd -p tsconfig.host.json
} else {
  throw 'typescript tsc not found (install deps or set DSH_CHECKOUT with node_modules)'
}
if ($LASTEXITCODE -ne 0) { throw 'host tsc failed' }
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'lib\prompt') | Out-Null
Copy-Item (Join-Path $Root 'src\prompt\taffy-system.md') (Join-Path $Root 'lib\prompt\taffy-system.md') -Force
& node (Join-Path $Root 'scripts\sync-persona.mjs')
Write-Host 'host build complete'
