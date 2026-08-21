# Link local dsh-taffy-theme into the DSH web profile (3080) for dev verification.
$ErrorActionPreference = 'Stop'
$env:TEMP = 'E:\taffy\.cache\temp'
$env:TMP = 'E:\taffy\.cache\temp'
if (-not $env:DSH_CHECKOUT) { $env:DSH_CHECKOUT = 'E:\DeepSeekHarness\src\deepseek-harness' }
if (-not $env:DSH_HOME) { $env:DSH_HOME = 'E:\DeepSeekHarness' }

$Root = Split-Path -Parent $PSScriptRoot
$ProfileDir = Join-Path $env:DSH_HOME 'profiles\web'
$PluginPath = $Root

Write-Host "== build $PluginPath =="
Set-Location $Root
if (-not (Test-Path "$Root\node_modules\schemastery")) { npm install }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build failed' }

Write-Host "== link install into web profile =="
Set-Location $ProfileDir
pnpm remove @dsh-external/dsh-taffy-theme 2>$null
pnpm add "link:$PluginPath"

Write-Host "== smoke: host entry import =="
Set-Location $Root
$nodePath = if ($env:NODE_PATH) { "$Root\node_modules;$env:NODE_PATH" } else { "$Root\node_modules" }
$env:NODE_PATH = $nodePath
node --input-type=module -e "import('./lib/index.js').then((m) => { if (!m.Config?.['~standard']?.validate) throw new Error('schema missing'); m.Config['~standard'].validate({}); console.log('host-import-ok'); })"
if ($LASTEXITCODE -ne 0) { throw 'host import smoke failed' }

Write-Host ""
Write-Host "Done. Restart DSH web and open http://127.0.0.1:3080"
Write-Host "Rollback: dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.2.tgz"
