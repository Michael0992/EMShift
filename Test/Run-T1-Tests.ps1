# Run-T1-Tests.ps1
# Fuehrt alle zu Task T1 gehoerenden PowerShell-Tests aus und gibt eine Gesamtuebersicht aus.
#
# Ausfuehrung (wegen ExecutionPolicy AllSigned per Gruppenrichtlinie) ueber Lesen + Invoke-Expression:
#   powershell -NoProfile -Command "$env:EMSHIFT_TEST_DIR='<Pfad-zum-Test-Ordner>'; Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $env:EMSHIFT_TEST_DIR 'Run-T1-Tests.ps1'))"
#
# Jeder Test laeuft in einem eigenen powershell.exe-Prozess (saubere Isolierung + eigener Exit-Code).
# Exit-Code 0 = alle Tests bestanden, 1 = mindestens ein Test fehlgeschlagen.

$ErrorActionPreference = "Stop"

# Test-Verzeichnis ermitteln (unter AllSigned wird dieses Skript per Invoke-Expression gestartet,
# daher ist $PSScriptRoot ggf. leer und wir greifen auf die Umgebungsvariable / das CWD zurueck).
$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'TestHelpers.ps1')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }

# Pfade an Kindprozesse vererben, damit Tests Hilfsdatei und index.html zuverlaessig finden.
$env:EMSHIFT_TEST_DIR = $testDir
$indexHtml = Join-Path $testDir '..\kampfderheere\public\index.html'
if (Test-Path -LiteralPath $indexHtml) {
    $env:EMSHIFT_INDEX_HTML = (Resolve-Path -LiteralPath $indexHtml).Path
}

# Reihenfolge: zuerst die aus den Akzeptanzkriterien (spec.md) abgeleiteten Tests,
# danach die formal spezifizierten Faelle aus tests.md, die zu T1 gehoeren.
$testFiles = @(
    "T1_Akzeptanzkriterien.Tests.ps1",
    "Test-001_ButtonSichtbarUndKlickbar.Tests.ps1",
    "Test-003_FunktionMitHumanParameter.Tests.ps1"
)

$failedFiles = @()

foreach ($file in $testFiles) {
    $path = Join-Path $testDir $file
    Write-Host ""
    Write-Host ("################  " + $file + "  ################") -ForegroundColor Yellow
    # Test als Text lesen und per Invoke-Expression in einem eigenen Prozess ausfuehren.
    & powershell.exe -NoProfile -Command "Invoke-Expression (Get-Content -Raw -LiteralPath '$path')"
    if ($LASTEXITCODE -ne 0) { $failedFiles += $file }
}

Write-Host ""
Write-Host "########################################################" -ForegroundColor Magenta
if ($failedFiles.Count -eq 0) {
    Write-Host "GESAMTERGEBNIS T1: ALLE TESTS BESTANDEN" -ForegroundColor Green
    exit 0
} else {
    Write-Host "GESAMTERGEBNIS T1: FEHLGESCHLAGEN" -ForegroundColor Red
    Write-Host "Fehlgeschlagene Test-Dateien:" -ForegroundColor Red
    $failedFiles | ForEach-Object { Write-Host (" - " + $_) -ForegroundColor Red }
    exit 1
}
