# TestHelpers.ps1
# Gemeinsame Hilfsfunktionen fuer die PowerShell-Tests der Funktion "Gegnersuche".
# Gemaess constitution.md werden BEWUSST keine Test-Frameworks verwendet, sondern reine
# PowerShell-Skripte (Testing: Fetch, Serverseitig und Powershell Scripting).
#
# Hinweis zur Ausfuehrung: Auf diesem System ist die ExecutionPolicy per Gruppenrichtlinie
# (MachinePolicy) auf AllSigned gesetzt. Unsignierte .ps1-Dateien koennen daher NICHT per
# "-File" oder Dot-Sourcing geladen werden. Die Tests werden deshalb als Text gelesen und mit
# Invoke-Expression ausgefuehrt (davon ist AllSigned nicht betroffen). Siehe Run-T1-Tests.ps1.
#
# Datei bewusst ohne Umlaute, um Encoding-Probleme unter Windows PowerShell 5.1 zu vermeiden.

# Ermittelt den absoluten Pfad zur zu pruefenden index.html des Spiels "kampfderheere".
# Reihenfolge: Umgebungsvariable EMSHIFT_INDEX_HTML, sonst Suche ab Test-Verzeichnis bzw.
# ab dem aktuellen Verzeichnis nach oben (kampfderheere\public\index.html).
function Get-IndexHtmlPath {
    if ($env:EMSHIFT_INDEX_HTML -and (Test-Path -LiteralPath $env:EMSHIFT_INDEX_HTML)) {
        return (Resolve-Path -LiteralPath $env:EMSHIFT_INDEX_HTML).Path
    }
    $startDirs = @()
    if ($env:EMSHIFT_TEST_DIR) { $startDirs += (Join-Path $env:EMSHIFT_TEST_DIR '..') }
    $startDirs += (Get-Location).Path
    foreach ($start in $startDirs) {
        $resolved = Resolve-Path -LiteralPath $start -ErrorAction SilentlyContinue
        if (-not $resolved) { continue }
        $dir = $resolved.Path
        for ($i = 0; $i -lt 8; $i++) {
            $candidate = Join-Path $dir 'kampfderheere\public\index.html'
            if (Test-Path -LiteralPath $candidate) { return (Resolve-Path -LiteralPath $candidate).Path }
            $parent = Split-Path $dir -Parent
            if (-not $parent -or $parent -eq $dir) { break }
            $dir = $parent
        }
    }
    throw "index.html (kampfderheere\public\index.html) wurde nicht gefunden. Bitte aus dem Projektordner ausfuehren oder `$env:EMSHIFT_INDEX_HTML setzen."
}

# Liest den gesamten Inhalt der index.html als einen einzelnen String ein.
function Get-IndexHtmlContent {
    $path = Get-IndexHtmlPath
    return (Get-Content -LiteralPath $path -Raw)
}

# Prueft, ob der HTML-Inhalt zum angegebenen Regex-Muster passt (Gross-/Kleinschreibung egal).
function Test-HtmlMatch {
    param(
        [Parameter(Mandatory)] [string]$Content,
        [Parameter(Mandatory)] [string]$Pattern
    )
    $options = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor `
               [System.Text.RegularExpressions.RegexOptions]::Singleline
    return [System.Text.RegularExpressions.Regex]::IsMatch($Content, $Pattern, $options)
}

# Liefert den oeffnenden <button ...>-Tag (Attribut-Teil) des "Spiel vs Mensch"-Buttons.
# Rueckgabe ist ein leerer String, wenn kein passender Button gefunden wird.
function Get-MenschButtonTag {
    param([Parameter(Mandatory)] [string]$Content)
    $options = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor `
               [System.Text.RegularExpressions.RegexOptions]::Singleline
    $match = [System.Text.RegularExpressions.Regex]::Match(
        $Content, '<button([^>]*)>\s*Spiel vs Mensch\s*</button>', $options)
    if ($match.Success) { return $match.Groups[1].Value }
    return ""
}

# Erstellt ein standardisiertes Ergebnisobjekt fuer eine einzelne Pruefung.
function New-TestResult {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] [bool]$Passed,
        [string]$Detail = ""
    )
    return [PSCustomObject]@{ Name = $Name; Passed = $Passed; Detail = $Detail }
}

# Gibt eine einzelne Ergebniszeile farbig auf der Konsole aus.
function Write-ResultLine {
    param([Parameter(Mandatory)] $Result)
    if ($Result.Passed) {
        Write-Host ("  [PASS] " + $Result.Name) -ForegroundColor Green
    } else {
        Write-Host ("  [FAIL] " + $Result.Name + " -> " + $Result.Detail) -ForegroundColor Red
    }
}

# Gibt eine Zusammenfassung aus und liefert $true zurueck, wenn alle Pruefungen bestanden wurden.
function Write-TestSummary {
    param(
        [Parameter(Mandatory)] [string]$Title,
        [Parameter(Mandatory)] [AllowEmptyCollection()] [object[]]$Results
    )
    $total  = @($Results).Count
    $passed = @($Results | Where-Object { $_.Passed }).Count
    $failed = $total - $passed
    Write-Host ""
    Write-Host ("==== " + $Title + " ====") -ForegroundColor Cyan
    Write-Host ("  Gesamt: $total | Bestanden: $passed | Fehlgeschlagen: $failed")
    return ($failed -eq 0)
}
