$ErrorActionPreference = 'Stop'

$nodeDir = 'C:\Program Files\nodejs'
if (Test-Path $nodeDir) {
  $env:Path = "$nodeDir;$env:Path"
}

Set-Location $PSScriptRoot

$repoPath = $PSScriptRoot.ToLowerInvariant()
$existingDev = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine.ToLowerInvariant().Contains('next dev') -and
    $_.CommandLine.ToLowerInvariant().Contains($repoPath)
  }

foreach ($proc in $existingDev) {
  Write-Host "Arret ancienne instance next dev (PID $($proc.ProcessId))..." -ForegroundColor Yellow
  Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
}

$lockFile = Join-Path $PSScriptRoot '.next\dev\lock'
if (Test-Path $lockFile) {
  Remove-Item -Force $lockFile -ErrorAction SilentlyContinue
}

npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Echec pendant npm install (code $LASTEXITCODE)." -ForegroundColor Red
  Write-Host ""
  Read-Host "Appuie sur Entree pour fermer"
  exit $LASTEXITCODE
}

npm run dev
$devExitCode = $LASTEXITCODE

Write-Host ""
if ($devExitCode -eq 0) {
  Write-Host "Serveur arrete." -ForegroundColor Yellow
} else {
  Write-Host "Le serveur s'est arrete avec le code $devExitCode." -ForegroundColor Red
}
Write-Host ""
Read-Host "Appuie sur Entree pour fermer"
exit $devExitCode
