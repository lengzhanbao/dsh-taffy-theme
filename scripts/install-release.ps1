# Install a local npm pack tarball into the DSH web profile (production-like smoke test).
$ErrorActionPreference = 'Stop'
$env:TEMP = 'E:\taffy\.cache\temp'
$env:TMP = 'E:\taffy\.cache\temp'
if (-not $env:DSH_HOME) { $env:DSH_HOME = 'E:\DeepSeekHarness' }
if (-not $env:DSH_CHECKOUT) { $env:DSH_CHECKOUT = 'E:\DeepSeekHarness\src\deepseek-harness' }

$Root = Split-Path -Parent $PSScriptRoot
$ProfileDir = Join-Path $env:DSH_HOME 'profiles\web'
$PackDir = Join-Path $env:TEMP 'taffy-pack-install'

Write-Host "== build + pack $Root =="
Set-Location $Root
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build failed' }
npm run verify:pack
if ($LASTEXITCODE -ne 0) { throw 'verify:pack failed' }

if (Test-Path $PackDir) { Remove-Item -Recurse -Force $PackDir }
New-Item -ItemType Directory -Force -Path $PackDir | Out-Null
Set-Location $Root
npm pack --pack-destination $PackDir | Out-Null
$Tgz = Get-ChildItem $PackDir -Filter '*.tgz' | Select-Object -First 1
if (-not $Tgz) { throw 'npm pack produced no tarball' }

Write-Host "== install tarball into web profile =="
Set-Location $ProfileDir
dsh plugin --profile web add $Tgz.FullName

Write-Host ""
Write-Host "Done. Restart: dsh web"
Write-Host "Rollback: dsh plugin --profile web add https://github.com/lengzhanbao/dsh-taffy-theme/releases/latest/download/dsh-external-dsh-taffy-theme-0.1.2.tgz"
