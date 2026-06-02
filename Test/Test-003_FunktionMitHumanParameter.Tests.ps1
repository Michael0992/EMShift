# Test-003_FunktionMitHumanParameter.Tests.ps1
# tests.md / Test-003: Ueberpruefen, ob beim Klick auf den Button "Spiel vs Mensch" eine
# Funktion mit dem Parameter "human" aufgerufen wird, um die Gegnersuche zu starten.

# --- Bootstrap: Hilfsfunktionen laden (Lesen + Invoke-Expression -> AllSigned-kompatibel) ---
$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'TestHelpers.ps1')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }
Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $testDir 'TestHelpers.ps1'))

$html      = Get-IndexHtmlContent
$buttonTag = Get-MenschButtonTag -Content $html
$results   = @()

$results += New-TestResult -Name "Button 'Spiel vs Mensch' besitzt einen onclick-Handler" `
    -Passed ($buttonTag -match 'onclick\s*=\s*"[^"]+"') `
    -Detail "Der Button besitzt keinen onclick-Handler."

$results += New-TestResult -Name "onclick ruft eine Funktion mit dem Parameter 'human' auf" `
    -Passed ($buttonTag -match 'onclick\s*=\s*"[^"]*\(\s*[''"]human[''"]\s*\)"') `
    -Detail "Es wird keine Funktion mit dem Parameter 'human' aufgerufen."

# Gegenprobe: Der uebergebene Parameter ist exakt 'human' (und nicht z.B. 'ai').
$results += New-TestResult -Name "Uebergebener Parameter ist exakt 'human' (nicht 'ai')" `
    -Passed (($buttonTag -match '\(\s*[''"]human[''"]\s*\)') -and ($buttonTag -notmatch '\(\s*[''"]ai[''"]\s*\)')) `
    -Detail "Der uebergebene Parameter ist nicht exakt 'human'."

foreach ($r in $results) { Write-ResultLine $r }
$allPassed = Write-TestSummary -Title "Test-003: Funktion mit Parameter 'human'" -Results $results
if ($allPassed) { exit 0 } else { exit 1 }
