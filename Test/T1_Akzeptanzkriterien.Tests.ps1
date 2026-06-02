# T1_Akzeptanzkriterien.Tests.ps1
# Tests, abgeleitet aus den Akzeptanzkriterien der spec.md, die in den Aufgabenbereich von
# Task T1 fallen: "Pruefen ob die index.html im public-Ordner ordnungsgemaess aufgebaut ist".
#
# Hinweis (T1): Serverseitig per fetch nachgeladene Inhalte (z.B. Benutzername, Profilbild)
# werden NICHT inhaltlich geprueft - hier wird nur sichergestellt, dass die Platzhalter
# vorhanden sind. Die Server-Logik wird in einem anderen Task ueberprueft.

# --- Bootstrap: Hilfsfunktionen laden (Lesen + Invoke-Expression -> AllSigned-kompatibel) ---
$testDir = if ($env:EMSHIFT_TEST_DIR) { $env:EMSHIFT_TEST_DIR }
           elseif ($PSScriptRoot)     { $PSScriptRoot }
           elseif (Test-Path (Join-Path (Get-Location).Path 'TestHelpers.ps1')) { (Get-Location).Path }
           else   { Join-Path (Get-Location).Path 'Test' }
Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $testDir 'TestHelpers.ps1'))

$html      = Get-IndexHtmlContent
$buttonTag = Get-MenschButtonTag -Content $html
$results   = @()

# --- T1: Grundlegender Aufbau (ordnungsgemaess strukturierte HTML5-Seite) ---
$results += New-TestResult -Name "HTML5-Dokumenttyp-Deklaration (<!DOCTYPE html>)" `
    -Passed (Test-HtmlMatch $html '<!DOCTYPE\s+html') `
    -Detail "DOCTYPE-Deklaration fehlt oder ist ungueltig."

$results += New-TestResult -Name "<html>-Element mit Sprachattribut (lang)" `
    -Passed (Test-HtmlMatch $html '<html[^>]*\blang\s*=\s*["''][a-z\-]+["'']') `
    -Detail "Das <html>-Element besitzt kein lang-Attribut."

$results += New-TestResult -Name "Zeichensatz UTF-8 deklariert" `
    -Passed (Test-HtmlMatch $html '<meta[^>]*charset\s*=\s*["'']?utf-8') `
    -Detail "Kein <meta charset=UTF-8> gefunden."

$results += New-TestResult -Name "Nicht-leerer Seitentitel vorhanden" `
    -Passed (Test-HtmlMatch $html '<title>\s*\S[^<]*</title>') `
    -Detail "Kein nicht-leerer <title> gefunden."

$results += New-TestResult -Name "Stylesheet menu.css eingebunden" `
    -Passed (Test-HtmlMatch $html '<link[^>]*href\s*=\s*["'']menu\.css["'']') `
    -Detail "menu.css ist nicht eingebunden."

$results += New-TestResult -Name "Skript menu.js eingebunden (stellt startGame bereit)" `
    -Passed (Test-HtmlMatch $html '<script[^>]*src\s*=\s*["'']menu\.js["'']') `
    -Detail "menu.js ist nicht eingebunden."

$results += New-TestResult -Name "Body-Element vorhanden" `
    -Passed ((Test-HtmlMatch $html '<body[^>]*>') -and (Test-HtmlMatch $html '</body>')) `
    -Detail "Kein <body>...</body> gefunden."

# --- T1-Hinweis: Platzhalter fuer serverseitig nachgeladene Inhalte sind vorhanden ---
$results += New-TestResult -Name "Platzhalter fuer Benutzername vorhanden (serverseitig befuellt)" `
    -Passed (Test-HtmlMatch $html 'id\s*=\s*["'']username_display["'']') `
    -Detail "Element mit id 'username_display' fehlt."

$results += New-TestResult -Name "Platzhalter fuer Profilbild vorhanden (serverseitig befuellt)" `
    -Passed (Test-HtmlMatch $html '<img[^>]*src\s*=\s*["'']/api/me/profile-picture["'']') `
    -Detail "Profilbild-<img> mit src '/api/me/profile-picture' fehlt."

# --- AK-1: Button "Spiel vs Mensch" ist sichtbar und klickbar ---
$results += New-TestResult -Name "AK-1: Button 'Spiel vs Mensch' ist vorhanden" `
    -Passed ($buttonTag -ne "") `
    -Detail "Kein <button>...Spiel vs Mensch...</button> gefunden."

$results += New-TestResult -Name "AK-1: Button 'Spiel vs Mensch' ist klickbar (nicht disabled)" `
    -Passed (($buttonTag -ne "") -and ($buttonTag -notmatch '\bdisabled\b')) `
    -Detail "Der Button ist mit 'disabled' deaktiviert."

$results += New-TestResult -Name "AK-1: Button 'Spiel vs Mensch' ist sichtbar (nicht hidden/display:none)" `
    -Passed (($buttonTag -ne "") -and ($buttonTag -notmatch '\bhidden\b') -and ($buttonTag -notmatch 'display\s*:\s*none') -and ($buttonTag -notmatch 'visibility\s*:\s*hidden')) `
    -Detail "Der Button ist per hidden-Attribut oder Inline-Style ausgeblendet."

# --- AK-3: Klick ruft eine Funktion mit Parameter "human" auf ---
$results += New-TestResult -Name "AK-3: Klick ruft Funktion mit Parameter 'human' auf" `
    -Passed ($buttonTag -match 'onclick\s*=\s*"[^"]*\(\s*[''"]human[''"]\s*\)"') `
    -Detail "onclick ruft keine Funktion mit dem Parameter 'human' auf."

foreach ($r in $results) { Write-ResultLine $r }
$allPassed = Write-TestSummary -Title "T1 Akzeptanzkriterien (spec.md)" -Results $results
if ($allPassed) { exit 0 } else { exit 1 }
