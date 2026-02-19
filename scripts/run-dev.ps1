$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$repoPath = $repoRoot.ToLowerInvariant()
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

$lockFile = Join-Path $repoRoot '.next\dev\lock'
if (Test-Path $lockFile) {
  Remove-Item -Force $lockFile -ErrorAction SilentlyContinue
}

function Get-FreeLocalPort {
  param(
    [int]$StartPort = 3000,
    [int]$EndPort = 3010
  )

  for ($p = $StartPort; $p -le $EndPort; $p++) {
    try {
      $used = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
      if ($used) {
        continue
      }
      return $p
    }
    catch {
      # If Get-NetTCPConnection is unavailable, fallback to netstat parsing.
      $netstatUsed = netstat -ano | Select-String -Pattern "[:\.]$p\s+.*LISTENING"
      if ($netstatUsed) {
        continue
      }
      return $p
    }
  }

  throw "Aucun port libre trouve entre $StartPort et $EndPort."
}

$port = Get-FreeLocalPort
$env:NEXTAUTH_URL = "http://localhost:$port"
Write-Host "Port local choisi: $port" -ForegroundColor Cyan
Write-Host "NEXTAUTH_URL local: $env:NEXTAUTH_URL" -ForegroundColor Cyan

function Start-BrowserWhenReady {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  return Start-Job -ScriptBlock {
    param($TargetUrl)
    $ProgressPreference = 'SilentlyContinue'

    for ($i = 0; $i -lt 120; $i++) {
      try {
        $response = Invoke-WebRequest -Uri "$TargetUrl/login" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
          Start-Process $TargetUrl
          return
        }
      }
      catch {
      }

      Start-Sleep -Milliseconds 500
    }
  } -ArgumentList $Url
}

if (-not (Test-Path (Join-Path $repoRoot 'node_modules'))) {
  Write-Host "node_modules absent: installation des dependances..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Echec pendant npm install (code $LASTEXITCODE)." -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuie sur Entree pour fermer"
    exit $LASTEXITCODE
  }
} else {
  Write-Host "Dependances detectees: npm install ignore." -ForegroundColor DarkGray
}

$openBrowserJob = Start-BrowserWhenReady -Url $env:NEXTAUTH_URL
Write-Host "Le navigateur s'ouvrira automatiquement a $($env:NEXTAUTH_URL)." -ForegroundColor Cyan

npm run dev -- --port $port
$devExitCode = $LASTEXITCODE

if ($openBrowserJob) {
  Remove-Job -Id $openBrowserJob.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
if ($devExitCode -eq 0) {
  Write-Host "Serveur arrete." -ForegroundColor Yellow
} else {
  Write-Host "Le serveur s'est arrete avec le code $devExitCode." -ForegroundColor Red
}
Write-Host ""
Read-Host "Appuie sur Entree pour fermer"
exit $devExitCode
