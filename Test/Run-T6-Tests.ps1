# Run-T6-Tests.ps1
# Fuehrt alle zu Task T6 gehoerenden Tests aus und gibt eine Gesamtuebersicht aus.
#
# T6 = Verfeinerung von Fall 1 (bestehender Raum: voll -> 200, sonst -> 202) in der POST-Route
# /spielraum + Usermodel-Schreibfunktionen (isRoomFull, joinRoom, createRoom).
# Getestet wird "serverseitig" mit Node.js (gemocktes UserModel/DB, simulierte Authentifizierung).
#
# Ausfuehrung (wegen ExecutionPolicy AllSigned per Gruppenrichtlinie) ueber Lesen + Invoke-Expression:
#   powershell -NoProfile -Command "$env:EMSHIFT_TEST_DIR='<Pfad>\Test'; Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $env:EMSHIFT_TEST_DIR 'Run-T6-Tests.ps1'))"
#
# Exit-Code 0 = alle Tests bestanden, 1 = mindestens ein Test fehlgeschlagen.

$ErrorActionPreference = "Stop"

$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'lib\serverTestHelpers.js')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "FEHLER: 'node' wurde nicht gefunden. Node.js wird fuer die T6-Tests benoetigt." -ForegroundColor Red
    exit 1
}

# Reihenfolge: zuerst die aus den Akzeptanzkriterien (spec.md) abgeleiteten Tests (Route + Usermodel),
# danach die formal spezifizierten Faelle aus tests.md, die zu T6 gehoeren.
$testFiles = @(
    "T6_Akzeptanzkriterien.Tests.js",
    "T6_Usermodel.Tests.js",
    "Test-008_WeiterleitungBeiGegnerGefunden.Tests.js",
    "Test-015_DatenbankAktualisierung.Tests.js"
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
    Write-Host "GESAMTERGEBNIS T6: ALLE TESTS BESTANDEN" -ForegroundColor Green
    exit 0
} else {
    Write-Host "GESAMTERGEBNIS T6: FEHLGESCHLAGEN" -ForegroundColor Red
    Write-Host "Fehlgeschlagene Test-Dateien:" -ForegroundColor Red
    $failedFiles | ForEach-Object { Write-Host (" - " + $_) -ForegroundColor Red }
    exit 1
}
