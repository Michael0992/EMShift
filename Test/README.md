# Tests – Feature „Gegnersuche"

Dieser Ordner enthält die Tests für das Feature **Gegnersuche** (`specs/001_feature_gegnersuche`).

## Grundsatz

Gemäß [`constitution.md`](../specify/constitution.md) werden **bewusst keine Test-Frameworks**
verwendet. Getestet wird mit **PowerShell-Scripting** (sowie Fetch/serverseitig in späteren Tasks).
Jeder Test ist ein eigenständiges PowerShell-Skript und liefert einen Exit-Code
(`0` = bestanden, `1` = fehlgeschlagen).

## Aktueller Stand: Task T1

T1 prüft, ob die `kampfderheere/public/index.html` ordnungsgemäß aufgebaut ist.
Serverseitig per `fetch` nachgeladene Inhalte werden in T1 **nicht** inhaltlich geprüft
(separater Task).

| Datei | Quelle | Inhalt |
|-------|--------|--------|
| `TestHelpers.ps1` | – | Gemeinsame Hilfsfunktionen (HTML laden, Prüfungen, Zusammenfassung) |
| `T1_Akzeptanzkriterien.Tests.ps1` | `spec.md` | Aufbau der Seite + AK-1 (Button sichtbar/klickbar) + AK-3 (Parameter „human") |
| `Test-001_ButtonSichtbarUndKlickbar.Tests.ps1` | `tests.md` | Test-001: Button „Spiel vs Mensch" sichtbar & klickbar |
| `Test-003_FunktionMitHumanParameter.Tests.ps1` | `tests.md` | Test-003: Funktion wird mit Parameter „human" aufgerufen |
| `Run-T1-Tests.ps1` | – | Runner: führt alle T1-Tests aus und liefert ein Gesamtergebnis |

Die Tests `Test-002`, `Test-004` … `Test-015` aus `tests.md` betreffen `menu.js`, die Server-Route
und die Datenbank und gehören zu den Tasks **T2–T11**. Sie sind daher **nicht** Teil von T1.

## Ausführen

Alle T1-Tests auf einmal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test\Run-T1-Tests.ps1
```

Einzelnen Test ausführen, z. B.:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test\Test-001_ButtonSichtbarUndKlickbar.Tests.ps1
```
