# Run-T4-Tests.ps1
# Fuehrt alle zu Task T4 gehoerenden Tests aus und gibt eine Gesamtuebersicht aus.
#
# Die T4-Tests pruefen die Verzweigung human/ai in der POST-Route /spielraum (Router/gameroom.js)
# und werden "serverseitig" mit Node.js + echtem Express ausgefuehrt (gemaess constitution.md ohne Framework).
# Dieser PowerShell-Runner ruft je Testdatei "node" auf und wertet den Exit-Code aus.
#
# Ausfuehrung (wegen ExecutionPolicy AllSigned per Gruppenrichtlinie) ueber Lesen + Invoke-Expression:
#   powershell -NoProfile -Command "$env:EMSHIFT_TEST_DIR='<Pfad>\Test'; Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $env:EMSHIFT_TEST_DIR 'Run-T4-Tests.ps1'))"
#
# Exit-Code 0 = alle Tests bestanden, 1 = mindestens ein Test fehlgeschlagen.

$ErrorActionPreference = "Stop"

$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'lib\serverTestHelpers.js')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "FEHLER: 'node' wurde nicht gefunden. Node.js wird fuer die T4-Tests benoetigt." -ForegroundColor Red
    exit 1
}

# Reihenfolge: zuerst die aus den Akzeptanzkriterien (spec.md) abgeleiteten Tests,
# danach die formal spezifizierten Faelle aus tests.md, die zu T4 gehoeren.
$testFiles = @(
    "T4_Akzeptanzkriterien.Tests.js",
    "Test-010_KiGegnersucheStatusUndNachricht.Tests.js"
)

$failedFiles = @()

foreach ($file in $testFiles) {
    $path = Join-Path $testDir $file
    Write-Host ""
    Write-Host ("################  " + $file + "  ################") -ForegroundColor Yellow
    & node $path
    if ($LASTEXITCODE -ne 0) { $failedFiles += $file }
}

Write-Host ""
Write-Host "########################################################" -ForegroundColor Magenta
if ($failedFiles.Count -eq 0) {
    Write-Host "GESAMTERGEBNIS T4: ALLE TESTS BESTANDEN" -ForegroundColor Green
    exit 0
} else {
    Write-Host "GESAMTERGEBNIS T4: FEHLGESCHLAGEN" -ForegroundColor Red
    Write-Host "Fehlgeschlagene Test-Dateien:" -ForegroundColor Red
    $failedFiles | ForEach-Object { Write-Host (" - " + $_) -ForegroundColor Red }
    exit 1
}
