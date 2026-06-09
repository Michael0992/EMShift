# Run-AllTests.ps1
# Fuehrt die GESAMTE Testsuite (alle bisherigen Tasks) aus und gibt ein Gesamtergebnis aus.
# Dies ist der "Live"-Einstiegspunkt fuer den aktuellen Stand der Suite (siehe Report/STATUS.md).
#
# Jeder Task-Runner wird in einem eigenen Prozess gestartet; deren Exit-Codes werden aggregiert.
#
# Ausfuehrung (wegen ExecutionPolicy AllSigned per Gruppenrichtlinie) ueber Lesen + Invoke-Expression:
#   powershell -NoProfile -Command "$env:EMSHIFT_TEST_DIR='<Pfad>\Test'; Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $env:EMSHIFT_TEST_DIR 'Run-AllTests.ps1'))"
#
# Exit-Code 0 = alle Tests bestanden, 1 = mindestens ein Task fehlgeschlagen.

$ErrorActionPreference = "Stop"

$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'lib\serverTestHelpers.js')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }

# An die Task-Runner (Kindprozesse) vererben.
$env:EMSHIFT_TEST_DIR = $testDir

$runners = @(
    "Run-T1-Tests.ps1",
    "Run-T2-Tests.ps1",
    "Run-T3-Tests.ps1",
    "Run-T4-Tests.ps1",
    "Run-T5-Tests.ps1",
    "Run-T6-Tests.ps1",
    "Run-T7-Tests.ps1",
    "Run-T8-Tests.ps1",
    "Run-T9-Tests.ps1",
    "Run-T10-Tests.ps1",
    "Run-T11-Tests.ps1"
)

$failed = @()

foreach ($r in $runners) {
    $path = Join-Path $testDir $r
    Write-Host ""
    Write-Host ("==================== " + $r + " ====================") -ForegroundColor Cyan
    & powershell.exe -NoProfile -Command "Invoke-Expression (Get-Content -Raw -LiteralPath '$path')"
    if ($LASTEXITCODE -ne 0) { $failed += $r }
}

Write-Host ""
Write-Host "########################################################" -ForegroundColor Magenta
if ($failed.Count -eq 0) {
    Write-Host "GESAMTSUITE (T1-T11): ALLE TESTS BESTANDEN" -ForegroundColor Green
    exit 0
} else {
    Write-Host "GESAMTSUITE: FEHLGESCHLAGEN" -ForegroundColor Red
    Write-Host "Fehlgeschlagene Task-Runner:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host (" - " + $_) -ForegroundColor Red }
    exit 1
}
