# Test-Status (Live) – Feature „Gegnersuche"

> **Dies ist die „Source of Truth" für den aktuellen Gesamtstand der Testsuite.**
> Die einzelnen `TX-Bericht.md` sind **Momentaufnahmen** zum jeweiligen Task-Zeitpunkt (wie Changelog-/PR-Einträge) und werden nicht rückwirkend geändert. Dieses Dokument zeigt den **jetzigen** Stand.

- **Letzte Aktualisierung:** 2026-06-09 (nach Task T11)
- **Ausführen der gesamten Suite:**
  ```powershell
  $env:EMSHIFT_TEST_DIR='<Pfad>\EMShift\Test'
  Invoke-Expression (Get-Content -Raw -LiteralPath (Join-Path $env:EMSHIFT_TEST_DIR 'Run-AllTests.ps1'))
  ```

## Aktueller Gesamtstand: ✅ ALLE GRÜN

| Task | Inhalt | Prüfungen | Status |
|------|--------|:---------:|:------:|
| T1 | `index.html` ordnungsgemäß aufgebaut | 19 | ✅ |
| T2 | `startGame` (POST, Modus, 200→/ingame, Retry) | 14 | ✅ |
| T3 | Route nach `Router/gameroom.js` migriert (POST) | 12 | ✅ |
| T4 | Verzweigung human/ai (ai → 501 + Nachricht) | 15 | ✅ |
| T5 | 3-Fälle-Verzweigung + Usermodel-Abfragen | 34 | ✅ |
| T6 | bestehender Raum: voll → 200, sonst → 202; `isRoomFull`/`joinRoom`/`createRoom` | 31 | ✅ |
| T7 | offenem Raum beitreten (`joinRoom`) → 200 | 11 | ✅ |
| T8 | neuen Raum erstellen (`createRoom`) → 202 | 10 | ✅ |
| T9 | Gegnersuche abbrechen (DELETE + `deleteRoom` + `cancelSearch`) | 29 | ✅ |
| T10 | Router-Mount `/api` in index.js + Frontendpfad `/api/spielraum` | 9 | ✅ |
| T11 | `startGame` UI-Reaktion: 200→redirect, 202→Nachricht, Fehler→retry; Button-Toggle | 13 | ✅ |
| **Summe** | | **197** | **✅** |

## Task T11 (2026-06-09): startGame UI-Reaktion

`menuTestHarness.js` erweitert: `document.getElementById` gibt nun verfolgte Elemente zurück
(`textContent`, `style.display`, `classList`). `createHarness()` liefert jetzt zusätzlich
`domElements`, damit T11-Tests den DOM-Zustand prüfen können. Rückwärtskompatibel —
bestehende T2–T10-Tests unverändert grün.

---

## Task T10 (2026-06-09): Router-Mount + Pfadanpassung

Kein Wartungsbedarf bei bestehenden Tests. `Test-009_SeitenNeuladen.Tests.js` ist
URL-agnostisch (`!!deleteCall`, kein URL-Vergleich), läuft daher nach dem Umbenennen
von `/spielraum` → `/api/spielraum` in `menu.js` unverändert grün.

---

## Test-Wartung am 2026-06-09 (T8)

Da T8 Fall 3 aktiviert (`createRoom` wird aufgerufen), wurden drei Testdateien angepasst, die Fall-3-Szenarien ohne `createRoom`-Mock enthielten — sonst würden sie nach T8 gegen die echte DB rennen:

| Datei | Anpassung |
|-------|-----------|
| `T5_Akzeptanzkriterien.Tests.js` | `UserModel.createRoom = async function () { return 99; }` in `setScenario()` |
| `T7_Akzeptanzkriterien.Tests.js` | Gleiche Ergänzung; Kommentar „Erstellen folgt in T8" aktualisiert |
| `Test-007_SucheOffeneRaeumeUndErstelle.Tests.js` | Gleiche Ergänzung; Dateikommentar angepasst |

Alle Erwartungen (Statuscodes, Aufrufreihenfolge) bleiben unverändert.

---

## Test-Wartung am 2026-06-06 (T7 → Rückwärtskompatibilität)

Die POST-Route `/spielraum` war anfangs ein **Platzhalter** und wurde mit jedem Task „echter" (T3 → T7). Dadurch prüften einige **frühere** Tests ein inzwischen abgelöstes Verhalten und liefen rot. Gemäß professioneller Praxis wurden diese Tests **an das aktuelle Verhalten angepasst** (nicht gelöscht, kein Archiv-Ordner – die Historie liegt in git). **Es wurde kein Produktionscode geändert.**

Angepasste Testdateien (nur Tests):

| Datei | Art der Anpassung |
|-------|-------------------|
| `T3_Akzeptanzkriterien.Tests.js` | Migrationstest: prüft „POST wird behandelt (kein 404/405)" statt „== 200" (fachlicher Status ist Sache von T4–T7) |
| `Test-004_ServerEmpfaengtAnfrage.Tests.js` | „Server nimmt Anfrage an (kein 404/405)" statt „== 200" |
| `T4_Akzeptanzkriterien.Tests.js` | Verzweigungstest: human „wird verarbeitet (kein 404)" statt „== 200"; Branch-Beweis über human≠ai + ai→501 |
| `T5_Akzeptanzkriterien.Tests.js` | `joinRoom` gemockt (seit T7 ruft Fall 2 es auf); Erwartung 200 unverändert korrekt |
| `Test-006_PruefeSpielerRaum.Tests.js` | `joinRoom` gemockt (kein versehentlicher echter DB-Zugriff) |
| `Test-007_SucheOffeneRaeumeUndErstelle.Tests.js` | `joinRoom` gemockt; Erwartung 200 unverändert korrekt |

**Grundsatz ab jetzt:** Ändert ein Task das Verhalten, werden die davon betroffenen Tests **im selben Schritt** mitgepflegt (Standardpraxis), damit die Suite durchgehend grün bleibt.

## Hinweise

- **Produktionscode unverändert** (`Router/gameroom.js`, `model/user.js` etc.) – die Logik war/ist korrekt; nur veraltete Test-Erwartungen/-Setups wurden aktualisiert.
- Historische Test-Stände sind über `git log` / `git show <commit>:<datei>` einsehbar – ein separater „Alt-Tests"-Ordner ist daher nicht nötig.
- Tests laufen ohne Framework (PowerShell + Node.js), gemäß `constitution.md`.
