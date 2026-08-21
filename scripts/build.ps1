$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Checkout = if ($env:DSH_CHECKOUT) { $env:DSH_CHECKOUT } else { 'E:\DeepSeekHarness\src\deepseek-harness' }
if (-not (Test-Path "$Checkout\packages")) {
  throw "DSH checkout not found: $Checkout"
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
function dataUrl(rel, mime) {
  const buf = fs.readFileSync(path.join(root, rel));
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}
function pick(cands) {
  for (const [rel, mime] of cands) {
    if (fs.existsSync(path.join(root, rel))) return dataUrl(rel, mime);
  }
  throw new Error('missing Taffy asset: ' + cands.map((c) => c[0]).join(', '));
}
const avatar = pick([
  ['assets/taffy/avatar.png', 'image/png'],
  ['assets/taffy/avatar.webp', 'image/webp'],
  ['assets/taffy/generated/avatar.png', 'image/png'],
  ['assets/taffy/generated/avatar.webp', 'image/webp'],
]);
const avatarNight = optional([
  ['assets/taffy/avatar-night.webp', 'image/webp'],
  ['assets/taffy/avatar-night.png', 'image/png'],
  ['assets/taffy/generated/avatar-night.webp', 'image/webp'],
  ['assets/taffy/generated/avatar-night.png', 'image/png'],
]);
const portrait = pick([
  ['assets/taffy/portrait.png', 'image/png'],
  ['assets/taffy/generated/portrait.png', 'image/png'],
  ['assets/taffy/portrait.webp', 'image/webp'],
  ['assets/taffy/generated/portrait.webp', 'image/webp'],
  ['assets/taffy/avatar.png', 'image/png'],
]);
function optional(cands) {
  for (const [rel, mime] of cands) {
    if (fs.existsSync(path.join(root, rel))) return dataUrl(rel, mime);
  }
  return '';
}
const wallpaperLight = optional([
  ['assets/taffy/wallpaper-light.webp', 'image/webp'],
  ['assets/taffy/generated/wallpaper-light.webp', 'image/webp'],
]);
const wallpaperDark = optional([
  ['assets/taffy/wallpaper-dark.webp', 'image/webp'],
  ['assets/taffy/generated/wallpaper-dark.webp', 'image/webp'],
]);
function figure(stem) {
  return pick([
    ['assets/taffy/' + stem + '.webp', 'image/webp'],
    ['assets/taffy/' + stem + '.png', 'image/png'],
    ['assets/taffy/generated/' + stem + '.webp', 'image/webp'],
    ['assets/taffy/generated/' + stem + '.png', 'image/png'],
  ]);
}
const assets = [
  'export const BUNDLED_AVATAR = ' + JSON.stringify(avatar) + ';',
  'export const BUNDLED_AVATAR_NIGHT = ' + JSON.stringify(avatarNight) + ';',
  'export const BUNDLED_PORTRAIT = ' + JSON.stringify(portrait) + ';',
  'export const BUNDLED_WALLPAPER_LIGHT = ' + JSON.stringify(wallpaperLight) + ';',
  'export const BUNDLED_WALLPAPER_DARK = ' + JSON.stringify(wallpaperDark) + ';',
  'export const BUNDLED_LEFT_LIGHT = ' + JSON.stringify(figure('left-light')) + ';',
  'export const BUNDLED_RIGHT_LIGHT = ' + JSON.stringify(figure('right-light')) + ';',
  'export const BUNDLED_LEFT_DARK = ' + JSON.stringify(figure('left-dark')) + ';',
  'export const BUNDLED_RIGHT_DARK = ' + JSON.stringify(figure('right-dark')) + ';',
].join('\n');
fs.writeFileSync(path.join(root, 'src/client/bundled-assets.ts'), assets);
const q = (stem, fallback) => optional([
  ['assets/taffy/icons/' + stem + '.webp', 'image/webp'],
  ['assets/taffy/icons/' + stem + '.png', 'image/png'],
  fallback,
]);
const qAssets = [
  '/** Generated by scripts/build.ps1 from assets/taffy/icons headshots. */',
  'export const BUNDLED_Q_SEND = ' + JSON.stringify(q('face-happy', ['assets/taffy/avatar.webp', 'image/webp'])) + ';',
  'export const BUNDLED_Q_STOP = ' + JSON.stringify(q('face-stop', ['assets/taffy/avatar.webp', 'image/webp'])) + ';',
  'export const BUNDLED_Q_NEW = ' + JSON.stringify(q('face-new', ['assets/taffy/avatar.webp', 'image/webp'])) + ';',
  'export const BUNDLED_Q_SETTINGS = ' + JSON.stringify(q('face-wink', ['assets/taffy/avatar.webp', 'image/webp'])) + ';',
  'export const BUNDLED_Q_BRAND = ' + JSON.stringify(q('face-look', ['assets/taffy/avatar.webp', 'image/webp'])) + ';',
  'export const BUNDLED_Q_COMMAND = ' + JSON.stringify(q('face-portrait', ['assets/taffy/portrait.webp', 'image/webp'])) + ';',
].join('\n');
fs.writeFileSync(path.join(root, 'src/client/bundled-q.ts'), qAssets);
"@

& node $Tsc -p tsconfig.json
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'lib\prompt') | Out-Null
Copy-Item (Join-Path $Root 'src\prompt\taffy-system.md') (Join-Path $Root 'lib\prompt\taffy-system.md') -Force
Write-Host 'host build complete'
