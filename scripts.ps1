# Task runner for Windows / PowerShell.
# Usage: .\scripts.ps1 <lint|test|build|all>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("lint", "test", "build", "all")]
    [string]$Target
)

$ErrorActionPreference = "Stop"

function Invoke-Lint {
    Write-Host "Running flake8..." -ForegroundColor Cyan
    python -m flake8 app.py freeze.py tests
}

function Invoke-Test {
    Write-Host "Running pytest..." -ForegroundColor Cyan
    python -m pytest -v
}

function Invoke-Build {
    Write-Host "Running Frozen-Flask build..." -ForegroundColor Cyan
    if (Test-Path build) { Remove-Item -Recurse -Force build }
    python freeze.py
}

switch ($Target) {
    "lint"  { Invoke-Lint }
    "test"  { Invoke-Test }
    "build" { Invoke-Build }
    "all"   { Invoke-Lint; Invoke-Test; Invoke-Build }
}
