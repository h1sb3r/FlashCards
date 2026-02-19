param(
  [string]$Branch = 'rewrite'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

git fetch origin

git checkout $Branch

git pull --rebase origin $Branch

Write-Host "Branch '$Branch' updated." -ForegroundColor Green