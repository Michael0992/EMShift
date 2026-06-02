# Test-001_ButtonSichtbarUndKlickbar.Tests.ps1
# tests.md / Test-001: Ueberpruefen, ob der Button "Spiel vs Mensch" auf der index.html-Seite
# sichtbar und klickbar ist, solange die Gegnersuche nicht laeuft.
#
# Geprueft wird der statische Auslieferungszustand der Seite (Zustand: Gegnersuche laeuft NICHT).

# --- Bootstrap: Hilfsfunktionen laden (Lesen + Invoke-Expression -> AllSigned-kompatibel) ---
$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'TestHelpers.ps1')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }
Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $testDir 'TestHelpers.ps1'))

$html      = Get-IndexHtmlContent
$buttonTag = Get-MenschButtonTag -Content $html
$results   = @()

$results += New-TestResult -Name "Button 'Spiel vs Mensch' existiert in der index.html" `
    -Passed ($buttonTag -ne "") `
    -Detail "Es wurde kein Button mit der Beschriftung 'Spiel vs Mensch' gefunden."

$results += New-TestResult -Name "Button ist sichtbar (kein hidden / kein display:none / kein visibility:hidden)" `
    -Passed (($buttonTag -ne "") -and ($buttonTag -notmatch '\bhidden\b') -and ($buttonTag -notmatch 'display\s*:\s*none') -and ($buttonTag -notmatch 'visibility\s*:\s*hidden')) `
    -Detail "Der Button wird im Auslieferungszustand ausgeblendet."

$results += New-TestResult -Name "Button ist klickbar (nicht disabled)" `
    -Passed (($buttonTag -ne "") -and ($buttonTag -notmatch '\bdisabled\b')) `
    -Detail "Der Button ist deaktiviert (disabled)."

foreach ($r in $results) { Write-ResultLine $r }
$allPassed = Write-TestSummary -Title "Test-001: Button sichtbar und klickbar" -Results $results
if ($allPassed) { exit 0 } else { exit 1 }
