$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

git fetch origin

git checkout main
git pull origin main
git merge --no-ff rewrite -m "merge: rewrite"
git push origin main

Write-Host "rewrite merged into main and pushed." -ForegroundColor Green