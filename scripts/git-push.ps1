param(
  [string]$Branch = 'rewrite',
  [string]$Message = 'chore: update flashcards rewrite'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

git checkout $Branch

git add .

if (-not (git diff --cached --quiet)) {
  git commit -m $Message
}

git push -u origin $Branch

Write-Host "Branch '$Branch' pushed." -ForegroundColor Green