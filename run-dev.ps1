$ErrorActionPreference = 'Stop'

$nodeDir = 'C:\Program Files\nodejs'
if (Test-Path $nodeDir) {
  $env:Path = "$nodeDir;$env:Path"
}

Set-Location $PSScriptRoot
npm install
npm run dev -- --open